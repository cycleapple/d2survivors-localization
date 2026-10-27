// 啟動器視窗
use crate::game::{self, BUILTIN};
use crate::jobs::{self, Job, Outcome};
use crate::manifest::{self, LauncherInfo, Manifest};
use crate::paths::{Config, DEFAULT_MANIFEST_URL};
use crate::selfupdate;
use eframe::egui;
use std::sync::mpsc::{channel, Receiver, Sender};

enum Msg {
    Log(String),
    Done { job: Job, outcome: Option<Outcome>, error: Option<String> },
}

pub struct App {
    config: Config,
    manifest: Option<Manifest>,
    /// 最新一次讀到的啟動器版本資訊
    launcher: Option<LauncherInfo>,
    logs: Vec<String>,
    busy: bool,
    show_settings: bool,
    tx: Sender<Msg>,
    rx: Receiver<Msg>,
}

impl App {
    fn new(cc: &eframe::CreationContext) -> Self {
        install_fonts(&cc.egui_ctx);
        let (tx, rx) = channel();
        let manifest = manifest::cached();
        let mut app = Self {
            config: Config::load(),
            launcher: manifest.as_ref().and_then(|m| m.launcher.clone()),
            manifest,
            logs: Vec::new(),
            busy: false,
            show_settings: false,
            tx,
            rx,
        };
        if app.config.auto_update {
            app.start(Job::Update, &cc.egui_ctx);
        }
        app
    }

    fn start(&mut self, job: Job, ctx: &egui::Context) {
        if self.busy {
            return;
        }
        let _ = self.config.save();
        self.busy = true;
        let (config, manifest, tx, ctx) = (self.config.clone(), self.manifest.clone(), self.tx.clone(), ctx.clone());
        std::thread::spawn(move || {
            let log = |s: String| {
                let _ = tx.send(Msg::Log(s));
                ctx.request_repaint();
            };
            let (outcome, error) = match jobs::run(job, &config, manifest, &log) {
                Ok(o) => (Some(o), None),
                Err(e) => (None, Some(format!("{e:#}"))),
            };
            let _ = tx.send(Msg::Done { job, outcome, error });
            ctx.request_repaint();
        });
    }

    /// 下拉選單的語言：manifest 裡桌面版能用的翻譯，加上遊戲原本的英文、韓文
    fn languages(&self) -> Vec<(String, String)> {
        let mut list: Vec<(String, String)> = Vec::new();
        if let Some(m) = &self.manifest {
            for (l, _) in m.desktop_languages() {
                let mut notes: Vec<String> = l.status_note().map(String::from).into_iter().collect();
                notes.push(if manifest::local_dict(l).is_some() { format!("{} 條", l.entries) } else { "尚未下載".into() });
                list.push((l.id.clone(), format!("{}（{}）", l.name, notes.join("・"))));
            }
        }
        list.extend(BUILTIN.iter().map(|(id, n)| (id.to_string(), n.to_string())));
        list
    }

    fn launcher_banner(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        let Some(info) = self.launcher.clone().filter(|l| selfupdate::newer(&l.latest)) else { return };
        ui.add_space(4.0);
        ui.horizontal(|ui| {
            if selfupdate::newer(&info.minimum) {
                ui.colored_label(egui::Color32::from_rgb(220, 90, 70), format!("新的翻譯需要啟動器 {}，請先更新", info.minimum));
            } else {
                ui.label(format!("有新版啟動器 {}（目前 {}）", info.latest, selfupdate::VERSION));
            }
            if ui.add_enabled(!self.busy, egui::Button::new("更新啟動器")).clicked() {
                self.start(Job::SelfUpdate, ctx);
            }
        });
    }
}

impl eframe::App for App {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        while let Ok(msg) = self.rx.try_recv() {
            match msg {
                Msg::Log(s) => self.logs.push(s),
                Msg::Done { job, outcome, error } => {
                    self.busy = false;
                    if let Some(o) = outcome {
                        if o.manifest.is_some() {
                            self.manifest = o.manifest;
                        }
                        // 更新失敗時 jobs 會帶回原本的；manifest 拿掉 launcher 區塊時就是沒有新版
                        self.launcher = o.launcher;
                        // 換成新版了：開新的啟動器，關掉自己
                        if let Some(exe) = o.restart {
                            let _ = self.config.save();
                            match std::process::Command::new(&exe).spawn() {
                                Ok(_) => ctx.send_viewport_cmd(egui::ViewportCommand::Close),
                                Err(e) => self.logs.push(format!("✖ 無法開啟新版啟動器，請手動重開：{e}")),
                            }
                        }
                    }
                    match error {
                        Some(e) => self.logs.push(format!("✖ {e}")),
                        None if job == Job::Launch && self.config.close_after_launch => {
                            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                        }
                        None => {}
                    }
                }
            }
        }

        egui::TopBottomPanel::bottom("log").resizable(false).exact_height(130.0).show(ctx, |ui| {
            egui::ScrollArea::vertical().stick_to_bottom(true).auto_shrink([false, false]).show(ui, |ui| {
                for l in &self.logs {
                    ui.label(egui::RichText::new(l).small());
                }
            });
        });

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.heading("D2 Survivors 啟動器");
                ui.label(egui::RichText::new(format!("v{}", selfupdate::VERSION)).small().weak());
            });
            let dir = self.config.game_dir();
            if !game::exists(&dir) {
                ui.colored_label(egui::Color32::from_rgb(220, 90, 70), format!("找不到遊戲：{}", dir.display()));
            }
            self.launcher_banner(ui, ctx);
            ui.add_space(8.0);

            let languages = self.languages();
            ui.add_enabled_ui(!self.busy, |ui| {
                ui.horizontal(|ui| {
                    ui.label("遊戲語言");
                    let selected = languages.iter().find(|(id, _)| *id == self.config.language)
                        .map_or_else(|| game::language_name(&self.config.language, self.manifest.as_ref()), |(_, n)| n.clone());
                    egui::ComboBox::from_id_salt("language").selected_text(selected).width(240.0).show_ui(ui, |ui| {
                        for (id, label) in languages {
                            ui.selectable_value(&mut self.config.language, id, label);
                        }
                    });
                });
            });
            ui.add_space(8.0);
            ui.checkbox(&mut self.config.auto_update, "啟動時自動更新翻譯");
            ui.checkbox(&mut self.config.close_after_launch, "遊戲啟動後關閉啟動器");
            ui.add_space(12.0);

            ui.add_enabled_ui(!self.busy, |ui| {
                ui.horizontal(|ui| {
                    let play = egui::Button::new(egui::RichText::new("  啟動遊戲  ").size(18.0));
                    if ui.add(play).clicked() {
                        self.start(Job::Launch, ctx);
                    }
                    if ui.button("檢查更新").clicked() {
                        self.start(Job::Update, ctx);
                    }
                    if ui.button("還原原版").on_hover_text("把遊戲的 app.asar 換回原版").clicked() {
                        self.start(Job::Restore, ctx);
                    }
                    if ui.button("設定").clicked() {
                        self.show_settings = !self.show_settings;
                    }
                    if self.busy {
                        ui.spinner();
                    }
                });
            });

            if self.show_settings {
                ui.add_space(8.0);
                egui::Grid::new("settings").num_columns(2).show(ui, |ui| {
                    ui.label("更新來源");
                    ui.add(egui::TextEdit::singleline(&mut self.config.manifest_url).hint_text(DEFAULT_MANIFEST_URL).desired_width(f32::INFINITY));
                    ui.end_row();
                    ui.label("遊戲資料夾");
                    let hint = crate::paths::default_game_dir().display().to_string();
                    ui.add(egui::TextEdit::singleline(&mut self.config.game_dir).hint_text(hint).desired_width(f32::INFINITY));
                    ui.end_row();
                });
            }
        });
    }

    fn on_exit(&mut self, _gl: Option<&eframe::glow::Context>) {
        let _ = self.config.save();
    }
}

/// egui 內建字型沒有中文、日文和韓文，借用 Windows 的字型（微軟正黑、雅黑也有假名）
fn install_fonts(ctx: &egui::Context) {
    let mut fonts = egui::FontDefinitions::default();
    let dir = std::env::var_os("WINDIR").map(std::path::PathBuf::from).unwrap_or_else(|| "C:\\Windows".into()).join("Fonts");
    for (name, file) in [("cjk", "msjh.ttc"), ("cjk-sc", "msyh.ttc"), ("hangul", "malgun.ttf")] {
        let Ok(bytes) = std::fs::read(dir.join(file)) else { continue };
        fonts.font_data.insert(name.into(), egui::FontData::from_owned(bytes).into());
        for family in [egui::FontFamily::Proportional, egui::FontFamily::Monospace] {
            fonts.families.entry(family).or_default().push(name.into());
        }
    }
    ctx.set_fonts(fonts);
}

pub fn run() -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([520.0, 440.0]).with_title("D2 Survivors 啟動器"),
        ..Default::default()
    };
    eframe::run_native("D2 Survivors 啟動器", options, Box::new(|cc| Ok(Box::new(App::new(cc)))))
}
