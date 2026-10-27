// 啟動器視窗：第一次開啟的設定精靈、主畫面、設定頁
use crate::game::{self, BUILTIN};
use crate::i18n::{tr, trf};
use crate::jobs::{self, Fallback, Job, Outcome};
use crate::manifest::{self, ChangelogEntry, LauncherInfo, Manifest};
use crate::paths::{self, Config, DEFAULT_MANIFEST_URL};
use crate::selfupdate;
use crate::system::{self, D2Kind};
use eframe::egui::{self, Color32, RichText};
use std::path::PathBuf;
use std::sync::mpsc::{channel, Receiver, Sender};

const RED: Color32 = Color32::from_rgb(220, 90, 70);
const GREEN: Color32 = Color32::from_rgb(120, 200, 120);
const GOLD: Color32 = Color32::from_rgb(222, 190, 120);
const WIZARD_STEPS: u8 = 4;

enum Msg {
    Log(String),
    Done { job: Job, outcome: Option<Outcome>, error: Option<String> },
    Shortcut(Result<PathBuf, String>),
}

#[derive(Clone, Copy, PartialEq)]
enum Page {
    /// 設定精靈的第幾步（0 語言、1 D2 Survivors、2 Diablo II、3 完成）
    Wizard(u8),
    Main,
    Settings,
}

pub struct App {
    config: Config,
    manifest: Option<Manifest>,
    /// 最新一次讀到的啟動器版本資訊
    launcher: Option<LauncherInfo>,
    /// 上次啟動時翻譯套不上、改用英文原版
    fallback: Option<Fallback>,
    /// 最新一筆更新紀錄，和它是不是還沒看過
    changelog: Option<ChangelogEntry>,
    changelog_unseen: bool,
    game_version: Option<String>,
    /// 檢查更新失敗過（精靈的語言清單顯示離線說明）
    update_failed: bool,
    error: Option<String>,
    notice: Option<String>,
    logs: Vec<String>,
    busy: bool,
    page: Page,
    /// 精靈完成頁的「建立桌面捷徑」
    make_shortcut: bool,
    /// 字型照哪個介面語言排的
    font_lang: String,
    tx: Sender<Msg>,
    rx: Receiver<Msg>,
}

impl App {
    fn new(cc: &eframe::CreationContext, play: bool) -> Self {
        let config = Config::load();
        style(&cc.egui_ctx);
        let (tx, rx) = channel();
        let manifest = manifest::cached();
        let mut app = Self {
            page: if config.wizard_done { Page::Main } else { Page::Wizard(0) },
            launcher: manifest.as_ref().and_then(|m| m.launcher.clone()),
            manifest,
            config,
            fallback: None,
            changelog: None,
            changelog_unseen: false,
            game_version: None,
            update_failed: false,
            error: None,
            notice: None,
            logs: Vec::new(),
            busy: false,
            make_shortcut: true,
            font_lang: String::new(),
            tx,
            rx,
        };
        app.refresh_game();
        if play && app.config.wizard_done {
            // 捷徑的 --play：開啟後直接啟動遊戲（裡面會先檢查更新）
            app.start(Job::Launch, &cc.egui_ctx);
        } else if app.config.auto_update || !app.config.wizard_done {
            app.start(Job::Update, &cc.egui_ctx);
        }
        app
    }

    fn ui_lang(&self) -> String {
        self.config.ui_language().to_string()
    }

    fn t(&self, key: &str) -> &'static str {
        tr(self.config.ui_language(), key)
    }

    fn tf(&self, key: &str, args: &[&str]) -> String {
        trf(self.config.ui_language(), key, args)
    }

    fn start(&mut self, job: Job, ctx: &egui::Context) {
        if self.busy {
            return;
        }
        let _ = self.config.save();
        self.busy = true;
        self.error = None;
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

    fn refresh_game(&mut self) {
        self.game_version = game::Game::new(self.config.game_dir()).ok().and_then(|g| g.version());
    }

    fn detect_d2(&mut self) {
        match system::find_d2() {
            Some((dir, kind)) => {
                self.config.d2_dir = dir.display().to_string();
                self.config.d2_kind = kind.id().into();
            }
            None => {
                self.config.d2_dir.clear();
                self.config.d2_kind.clear();
            }
        }
    }

    fn d2(&self) -> Option<(PathBuf, D2Kind)> {
        let dir = PathBuf::from(self.config.d2_dir.trim());
        (!self.config.d2_dir.trim().is_empty()).then_some(()).and_then(|_| system::d2_kind(&dir).map(|k| (dir, k)))
    }

    /// 語言清單：manifest 裡桌面版能用的翻譯，加上遊戲原本的英文、韓文
    fn languages(&self) -> Vec<(String, String)> {
        let mut list: Vec<(String, String)> = Vec::new();
        if let Some(m) = &self.manifest {
            for (l, _) in m.desktop_languages() {
                let mut notes: Vec<String> = Vec::new();
                match l.status.as_str() {
                    "beta" => notes.push(self.t("beta").into()),
                    "draft" => notes.push(self.t("draft").into()),
                    _ => {}
                }
                notes.push(if manifest::local_dict(l).is_some() { self.tf("entries", &[&l.entries.to_string()]) } else { self.t("not_downloaded").into() });
                list.push((l.id.clone(), format!("{}（{}）", l.name, notes.join("・"))));
            }
        }
        for (id, _) in BUILTIN {
            let name = if id == "en" { "English".to_string() } else { format!("한국어（{}）", self.t("original")) };
            list.push((id.to_string(), name));
        }
        list
    }

    fn handle_messages(&mut self, ctx: &egui::Context) {
        while let Ok(msg) = self.rx.try_recv() {
            match msg {
                Msg::Log(s) => self.logs.push(s),
                Msg::Shortcut(r) => match r {
                    Ok(p) => {
                        self.logs.push(format!("捷徑：{}", p.display()));
                        self.notice = Some(self.t("shortcut_done").into());
                    }
                    Err(e) => self.error = Some(e),
                },
                Msg::Done { job, outcome, error } => {
                    self.busy = false;
                    if job == Job::Update {
                        self.update_failed = error.is_some();
                    }
                    if let Some(o) = outcome {
                        if o.manifest.is_some() {
                            self.manifest = o.manifest;
                        }
                        // 更新失敗時 jobs 會帶回原本的；manifest 拿掉 launcher 區塊時就是沒有新版
                        self.launcher = o.launcher;
                        if let Some(c) = o.changelog {
                            self.changelog_unseen = jobs::changelog_unseen(&c);
                            self.changelog = Some(c);
                        }
                        if job == Job::Launch || job == Job::Install {
                            self.fallback = o.fallback;
                        }
                        if o.game_version.is_some() {
                            self.game_version = o.game_version;
                        }
                        // 換成新版了：開新的啟動器，關掉自己
                        if let Some(exe) = o.restart {
                            let _ = self.config.save();
                            match std::process::Command::new(&exe).spawn() {
                                Ok(_) => ctx.send_viewport_cmd(egui::ViewportCommand::Close),
                                Err(e) => self.error = Some(format!("{e}")),
                            }
                        }
                    }
                    match error {
                        Some(e) => {
                            self.logs.push(format!("✖ {e}"));
                            // 檢查更新失敗（離線之類）不跳錯誤，狀態區另外提示；精靈裡的語言清單也另外說明
                            if job != Job::Update {
                                self.error = Some(e);
                            }
                        }
                        // 改用英文原版開的話，留著視窗讓玩家看到原因
                        None if job == Job::Launch && self.config.close_after_launch && self.fallback.is_none() => {
                            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                        }
                        None => {}
                    }
                }
            }
        }
    }

    // ── 共用的小元件 ──

    fn banner(ui: &mut egui::Ui, fill: Color32, text_color: Color32, add: impl FnOnce(&mut egui::Ui)) {
        egui::Frame::new().fill(fill).corner_radius(6.0).inner_margin(egui::Margin::symmetric(10, 8)).show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.visuals_mut().override_text_color = Some(text_color);
            add(ui);
        });
        ui.add_space(6.0);
    }

    fn big_button(ui: &mut egui::Ui, text: &str, enabled: bool) -> bool {
        let b = egui::Button::new(RichText::new(text).size(22.0).strong().color(Color32::WHITE))
            .fill(Color32::from_rgb(150, 36, 24))
            .min_size(egui::vec2(0.0, 52.0))
            .corner_radius(6.0);
        // 置中：按鈕的字照外層的對齊方式放
        ui.vertical_centered_justified(|ui| ui.add_enabled(enabled, b).clicked()).inner
    }

    fn language_picker(&mut self, ui: &mut egui::Ui, combo: bool) {
        let languages = self.languages();
        if combo {
            let selected = languages.iter().find(|(id, _)| *id == self.config.language).map_or(self.config.language.clone(), |(_, n)| n.clone());
            egui::ComboBox::from_id_salt("language").selected_text(RichText::new(selected).size(16.0)).width(ui.available_width()).height(320.0).show_ui(ui, |ui| {
                for (id, label) in languages {
                    ui.selectable_value(&mut self.config.language, id, RichText::new(label).size(15.0));
                }
            });
        } else {
            for (id, label) in languages {
                ui.radio_value(&mut self.config.language, id, RichText::new(label).size(16.0));
            }
        }
    }

    fn path_row(ui: &mut egui::Ui, ok: bool, title: &str, detail: Option<String>) {
        ui.horizontal(|ui| {
            ui.label(RichText::new(if ok { "✔" } else { "✖" }).size(20.0).color(if ok { GREEN } else { RED }));
            ui.vertical(|ui| {
                ui.label(RichText::new(title).size(16.0).strong());
                if let Some(d) = detail {
                    ui.label(RichText::new(d).small().weak());
                }
            });
        });
    }

    // ── 設定精靈 ──

    fn wizard(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, step: u8) {
        ui.label(RichText::new(self.tf("step", &[&(step + 1).to_string(), &WIZARD_STEPS.to_string()])).weak());
        ui.add_space(4.0);
        let mut next: Option<Page> = None;
        match step {
            0 => {
                ui.heading(self.t("lang_title"));
                ui.label(self.t("lang_desc"));
                ui.add_space(10.0);
                if self.manifest.is_none() {
                    if self.busy {
                        ui.horizontal(|ui| {
                            ui.spinner();
                            ui.label(self.t("lang_loading"));
                        });
                    } else if self.update_failed {
                        ui.colored_label(GOLD, self.t("lang_offline"));
                    }
                    ui.add_space(6.0);
                }
                self.language_picker(ui, false);
            }
            1 => {
                ui.heading(self.t("game_title"));
                ui.add_space(10.0);
                let dir = self.config.game_dir();
                if game::exists(&dir) {
                    let v = self.game_version.as_deref().map(|v| self.tf("game_version", &[v])).unwrap_or_default();
                    Self::path_row(ui, true, self.t("game_found"), Some(format!("{}  {v}", system::display_path(&dir))));
                } else {
                    Self::path_row(ui, false, self.t("game_missing"), None);
                    ui.add_space(6.0);
                    ui.label(self.t("game_missing_desc"));
                    ui.add_space(8.0);
                    if ui.button(RichText::new(self.t("open_game_site")).size(15.0)).clicked() {
                        system::open_url(system::GAME_URL);
                    }
                }
                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    if ui.button(self.t("redetect")).clicked() {
                        self.config.game_dir.clear();
                        self.refresh_game();
                    }
                    if ui.button(self.t("choose_folder")).clicked() {
                        if let Some(d) = system::pick_folder(&dir) {
                            self.config.game_dir = d.display().to_string();
                            self.refresh_game();
                        }
                    }
                });
            }
            2 => {
                ui.heading(self.t("d2_title"));
                ui.label(self.t("d2_desc"));
                ui.add_space(10.0);
                match self.d2() {
                    Some((dir, kind)) => {
                        let title = if kind == D2Kind::Resurrected { self.t("d2_found_d2r") } else { self.t("d2_found_classic") };
                        Self::path_row(ui, true, title, Some(system::display_path(&dir)));
                    }
                    None => {
                        Self::path_row(ui, false, self.t("d2_missing"), None);
                        ui.add_space(6.0);
                        ui.label(self.t("d2_missing_desc"));
                        ui.add_space(8.0);
                        if ui.button(RichText::new(self.t("open_blizzard")).size(15.0)).clicked() {
                            system::open_url(system::D2R_URL);
                        }
                    }
                }
                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    if ui.button(self.t("redetect")).clicked() {
                        self.detect_d2();
                    }
                    if ui.button(self.t("choose_folder")).clicked() {
                        let start = self.d2().map(|(d, _)| d).unwrap_or_default();
                        if let Some(d) = system::pick_folder(&start) {
                            self.config.d2_kind = system::d2_kind(&d).map_or("", |k| k.id()).into();
                            self.config.d2_dir = d.display().to_string();
                        }
                    }
                });
            }
            _ => {
                ui.heading(self.t("done_title"));
                ui.label(self.t("done_desc"));
                ui.add_space(12.0);
                ui.label(RichText::new(self.t("links")).strong());
                ui.horizontal(|ui| {
                    if ui.link(self.t("site_link")).clicked() {
                        system::open_url(system::SITE_URL);
                    }
                    if !system::DISCORD_URL.is_empty() && ui.link(self.t("discord_link")).clicked() {
                        system::open_url(system::DISCORD_URL);
                    }
                });
                ui.add_space(10.0);
                let label = self.t("create_shortcut");
                ui.checkbox(&mut self.make_shortcut, label);
                ui.add_space(16.0);
                let play = Self::big_button(ui, self.t("play"), !self.busy && game::exists(&self.config.game_dir()));
                ui.add_space(16.0);
                ui.separator();
                let mut finish = false;
                ui.horizontal(|ui| {
                    if ui.button(self.t("back")).clicked() {
                        next = Some(Page::Wizard(step - 1));
                    }
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        finish = ui.button(RichText::new(self.t("finish")).size(16.0)).clicked();
                    });
                });
                if play || finish {
                    self.finish_wizard(ctx);
                    if play {
                        self.start(Job::Launch, ctx);
                    }
                }
            }
        }

        // 上一步／下一步
        if step < WIZARD_STEPS - 1 {
            ui.add_space(16.0);
            ui.separator();
            ui.horizontal(|ui| {
                if step > 0 && ui.button(self.t("back")).clicked() {
                    next = Some(Page::Wizard(step - 1));
                }
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    let ok = match step {
                        1 => game::exists(&self.config.game_dir()),
                        2 => self.d2().is_some(),
                        _ => true,
                    };
                    let label = if ok { self.t("next") } else { self.t("skip") };
                    if ui.button(RichText::new(label).size(16.0)).clicked() {
                        next = Some(Page::Wizard(step + 1));
                    }
                });
            });
        }

        if let Some(p) = next {
            // 進到 Diablo II 那一步時，還沒偵測過就先偵測
            if p == Page::Wizard(2) && self.d2().is_none() {
                self.detect_d2();
            }
            if p == Page::Wizard(1) {
                self.refresh_game();
            }
            let _ = self.config.save();
            self.page = p;
        }
    }

    fn finish_wizard(&mut self, ctx: &egui::Context) {
        self.config.wizard_done = true;
        let _ = self.config.save();
        self.page = Page::Main;
        if self.make_shortcut {
            self.create_shortcut(ctx);
        }
    }

    fn create_shortcut(&mut self, ctx: &egui::Context) {
        let (tx, name, ctx) = (self.tx.clone(), self.t("app_title").to_string(), ctx.clone());
        std::thread::spawn(move || {
            let _ = tx.send(Msg::Shortcut(system::create_shortcut(&name).map_err(|e| format!("{e:#}"))));
            ctx.request_repaint();
        });
    }

    // ── 主畫面 ──

    fn main_page(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        self.banners(ui, ctx);

        ui.label(RichText::new(self.t("game_language")).strong());
        ui.add_enabled_ui(!self.busy, |ui| self.language_picker(ui, true));
        ui.add_space(14.0);

        let game_ok = game::exists(&self.config.game_dir());
        if Self::big_button(ui, self.t("play"), !self.busy && game_ok) {
            if let Some(c) = &self.changelog {
                // 更新紀錄顯示著時按了啟動，就當成看過了
                let _ = jobs::mark_changelog_seen(&c.version);
                self.changelog_unseen = false;
            }
            self.start(Job::Launch, ctx);
        }
        ui.add_space(4.0);
        ui.horizontal(|ui| {
            if self.busy {
                ui.spinner();
                ui.label(RichText::new(self.logs.last().cloned().unwrap_or_else(|| self.t("working").into())).small().weak());
            } else if let Some(l) = self.logs.last() {
                ui.label(RichText::new(l).small().weak());
            }
        });
        ui.add_space(10.0);
        self.status(ui, ctx);
    }

    fn banners(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        if !game::exists(&self.config.game_dir()) {
            Self::banner(ui, Color32::from_rgb(80, 30, 25), Color32::from_rgb(255, 200, 190), |ui| {
                ui.label(self.t("game_missing_banner"));
            });
        }
        if let Some(f) = self.fallback {
            Self::banner(ui, Color32::from_rgb(90, 60, 20), Color32::from_rgb(255, 220, 150), |ui| {
                ui.label(self.t(f.key()));
            });
        }
        if let Some(e) = self.error.clone() {
            let text = self.tf("error", &[&e]);
            Self::banner(ui, Color32::from_rgb(80, 30, 25), Color32::from_rgb(255, 200, 190), |ui| {
                ui.label(text);
            });
        }
        if let Some(n) = self.notice.clone() {
            Self::banner(ui, Color32::from_rgb(30, 60, 35), Color32::from_rgb(200, 240, 200), |ui| {
                ui.label(n);
            });
        }
        if let Some(info) = self.launcher.clone().filter(|l| selfupdate::newer(&l.minimum)) {
            let text = self.tf("launcher_required", &[&info.minimum]);
            let label = self.t("update_launcher");
            let busy = self.busy;
            let mut go = false;
            Self::banner(ui, Color32::from_rgb(90, 60, 20), Color32::from_rgb(255, 220, 150), |ui| {
                ui.horizontal_wrapped(|ui| {
                    ui.label(text);
                    go = ui.add_enabled(!busy, egui::Button::new(label)).clicked();
                });
            });
            if go {
                self.start(Job::SelfUpdate, ctx);
            }
        }
        if let Some(c) = self.changelog.clone().filter(|_| self.changelog_unseen) {
            let summary = c.summary_for(&self.ui_lang()).unwrap_or("").to_string();
            let (title, got) = (format!("{} {}", self.t("changelog"), c.date), self.t("got_it"));
            let mut seen = false;
            Self::banner(ui, Color32::from_rgb(35, 45, 70), Color32::from_rgb(210, 220, 245), |ui| {
                ui.horizontal_wrapped(|ui| {
                    ui.label(RichText::new(title).strong());
                    ui.label(summary);
                    seen = ui.small_button(got).clicked();
                });
            });
            if seen {
                let _ = jobs::mark_changelog_seen(&c.version);
                self.changelog_unseen = false;
            }
        }
    }

    fn status(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        egui::Frame::new().fill(ui.visuals().faint_bg_color).corner_radius(6.0).inner_margin(egui::Margin::same(10)).show(ui, |ui| {
            ui.set_width(ui.available_width());
            egui::Grid::new("status").num_columns(2).spacing([16.0, 6.0]).show(ui, |ui| {
                ui.label(RichText::new(self.t("status_translation")).weak());
                ui.horizontal_wrapped(|ui| {
                    ui.label(self.manifest.as_ref().map_or("—".into(), |m| m.version.clone()));
                    if self.update_failed {
                        ui.colored_label(GOLD, self.t("update_failed")).on_hover_text(self.logs.iter().rev().find(|l| l.starts_with('✖')).cloned().unwrap_or_default());
                    }
                });
                ui.end_row();
                ui.label(RichText::new(self.t("status_game")).weak());
                ui.label(self.game_version.clone().unwrap_or_else(|| "—".into()));
                ui.end_row();
                ui.label(RichText::new(self.t("status_launcher")).weak());
                ui.horizontal(|ui| {
                    ui.label(format!("v{}", selfupdate::VERSION));
                    match self.launcher.clone().filter(|l| selfupdate::newer(&l.latest)) {
                        Some(l) => {
                            ui.colored_label(GOLD, self.tf("launcher_new", &[&l.latest]));
                            if ui.add_enabled(!self.busy, egui::Button::new(self.t("update_launcher")).small()).clicked() {
                                self.start(Job::SelfUpdate, ctx);
                            }
                        }
                        None => {
                            ui.label(RichText::new(self.t("up_to_date")).weak());
                        }
                    }
                });
                ui.end_row();
                if let Some(c) = self.changelog.clone().filter(|_| !self.changelog_unseen) {
                    ui.label(RichText::new(self.t("changelog")).weak());
                    ui.label(format!("{}  {}", c.date, c.summary_for(&self.ui_lang()).unwrap_or("")));
                    ui.end_row();
                }
            });
        });
        ui.add_space(8.0);
        ui.horizontal(|ui| {
            if ui.add_enabled(!self.busy, egui::Button::new(self.t("check_updates"))).clicked() {
                self.start(Job::Update, ctx);
            }
        });
    }

    // ── 設定 ──

    fn settings_page(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        if let Some(n) = self.notice.clone() {
            Self::banner(ui, Color32::from_rgb(30, 60, 35), Color32::from_rgb(200, 240, 200), |ui| {
                ui.label(n);
            });
        }
        if let Some(e) = self.error.clone() {
            let text = self.tf("error", &[&e]);
            Self::banner(ui, Color32::from_rgb(80, 30, 25), Color32::from_rgb(255, 200, 190), |ui| {
                ui.label(text);
            });
        }
        // 每一項：標題一行，下面是欄位和按鈕
        ui.label(RichText::new(self.t("game_folder")).strong());
        ui.horizontal(|ui| {
            let hint = system::display_path(&paths::default_game_dir());
            let w = ui.available_width() - 130.0;
            if ui.add(egui::TextEdit::singleline(&mut self.config.game_dir).hint_text(hint).desired_width(w)).lost_focus() {
                self.refresh_game();
            }
            if ui.button(self.t("choose_folder")).clicked() {
                if let Some(d) = system::pick_folder(&self.config.game_dir()) {
                    self.config.game_dir = d.display().to_string();
                    self.refresh_game();
                }
            }
        });
        ui.add_space(8.0);

        ui.label(RichText::new(self.t("d2_folder")).strong());
        let text = self.d2().map_or(self.t("not_found").to_string(), |(d, _)| system::display_path(&d));
        ui.label(RichText::new(text).weak());
        ui.horizontal(|ui| {
            if ui.button(self.t("detect")).clicked() {
                self.detect_d2();
            }
            if ui.button(self.t("choose_folder")).clicked() {
                let start = self.d2().map(|(d, _)| d).unwrap_or_default();
                if let Some(d) = system::pick_folder(&start) {
                    self.config.d2_kind = system::d2_kind(&d).map_or("", |k| k.id()).into();
                    self.config.d2_dir = d.display().to_string();
                }
            }
        });
        ui.add_space(8.0);

        ui.label(RichText::new(self.t("update_source")).strong());
        ui.add(egui::TextEdit::singleline(&mut self.config.manifest_url).hint_text(DEFAULT_MANIFEST_URL).desired_width(ui.available_width()));
        ui.add_space(10.0);
        let (auto, close) = (self.t("auto_update"), self.t("close_after"));
        ui.checkbox(&mut self.config.auto_update, auto);
        ui.checkbox(&mut self.config.close_after_launch, close);
        ui.add_space(10.0);
        ui.horizontal_wrapped(|ui| {
            if ui.add_enabled(!self.busy, egui::Button::new(self.t("restore"))).on_hover_text(self.t("restore_hint")).clicked() {
                self.start(Job::Restore, ctx);
            }
            if ui.button(self.t("create_shortcut")).clicked() {
                self.create_shortcut(ctx);
            }
            if ui.button(self.t("rerun_wizard")).clicked() {
                self.page = Page::Wizard(0);
            }
            if ui.link(self.t("site_link")).clicked() {
                system::open_url(system::SITE_URL);
            }
        });
        ui.add_space(10.0);
        egui::CollapsingHeader::new(self.t("cli")).show(ui, |ui| {
            ui.label(RichText::new(CLI_HELP).monospace().small());
        });
        egui::CollapsingHeader::new(self.t("log")).show(ui, |ui| {
            egui::ScrollArea::vertical().max_height(160.0).stick_to_bottom(true).show(ui, |ui| {
                for l in &self.logs {
                    ui.label(RichText::new(l).small());
                }
            });
        });
    }
}

const CLI_HELP: &str = "d2s-launcher --launch [--lang zh-TW|zh-CN|ja|de|fr|ru|en|ko] [--no-update]
d2s-launcher --play          (開視窗並直接啟動遊戲，桌面捷徑用這個)
d2s-launcher --install | --update | --restore | --self-update | --status
d2s-launcher --manifest <網址或路徑> --save";

impl eframe::App for App {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.handle_messages(ctx);
        // 介面語言換了：中文字型的順序跟著換（簡中優先用雅黑）
        let lang = self.ui_lang();
        if self.font_lang != lang {
            install_fonts(ctx, &lang);
            self.font_lang = lang;
            ctx.send_viewport_cmd(egui::ViewportCommand::Title(self.t("app_title").into()));
        }

        egui::CentralPanel::default().show(ctx, |ui| {
            // 標題列
            ui.horizontal(|ui| {
                ui.heading(RichText::new(self.t("app_title")).color(GOLD));
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| match self.page {
                    Page::Main => {
                        if ui.button(self.t("settings")).clicked() {
                            self.page = Page::Settings;
                        }
                    }
                    Page::Settings => {
                        if ui.button(format!("← {}", self.t("return"))).clicked() {
                            let _ = self.config.save();
                            self.page = Page::Main;
                        }
                    }
                    Page::Wizard(_) => {}
                });
            });
            ui.separator();
            ui.add_space(4.0);
            egui::ScrollArea::vertical().auto_shrink([false, false]).show(ui, |ui| match self.page {
                Page::Wizard(step) => self.wizard(ui, ctx, step),
                Page::Main => self.main_page(ui, ctx),
                Page::Settings => self.settings_page(ui, ctx),
            });
        });
    }

    fn on_exit(&mut self, _gl: Option<&eframe::glow::Context>) {
        let _ = self.config.save();
    }
}

fn style(ctx: &egui::Context) {
    ctx.set_visuals(egui::Visuals::dark());
    ctx.style_mut(|s| {
        s.spacing.item_spacing = egui::vec2(8.0, 6.0);
        s.spacing.button_padding = egui::vec2(10.0, 5.0);
        s.text_styles.insert(egui::TextStyle::Heading, egui::FontId::proportional(22.0));
        s.text_styles.insert(egui::TextStyle::Body, egui::FontId::proportional(15.0));
        s.text_styles.insert(egui::TextStyle::Button, egui::FontId::proportional(15.0));
    });
}

/// egui 內建字型沒有中文、日文和韓文，借用 Windows 的字型（微軟正黑、雅黑也有假名）。
/// 簡中介面把雅黑排前面，字形才是簡體的寫法
fn install_fonts(ctx: &egui::Context, ui_lang: &str) {
    let mut fonts = egui::FontDefinitions::default();
    let dir = std::env::var_os("WINDIR").map(PathBuf::from).unwrap_or_else(|| "C:\\Windows".into()).join("Fonts");
    let mut list = vec![("cjk-tc", "msjh.ttc"), ("cjk-sc", "msyh.ttc"), ("ja", "YuGothM.ttc"), ("hangul", "malgun.ttf")];
    match ui_lang {
        "zh-CN" => list.swap(0, 1),
        "ja" => list.rotate_left(2),
        _ => {}
    }
    for (name, file) in list {
        let Ok(bytes) = std::fs::read(dir.join(file)) else { continue };
        fonts.font_data.insert(name.into(), egui::FontData::from_owned(bytes).into());
        for family in [egui::FontFamily::Proportional, egui::FontFamily::Monospace] {
            fonts.families.entry(family).or_default().push(name.into());
        }
    }
    ctx.set_fonts(fonts);
}

pub fn run(play: bool) -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([560.0, 560.0]).with_min_inner_size([460.0, 420.0]).with_title("D2 Survivors"),
        ..Default::default()
    };
    eframe::run_native("D2 Survivors 啟動器", options, Box::new(move |cc| Ok(Box::new(App::new(cc, play)))))
}
