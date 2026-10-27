// 啟動器視窗：第一次開啟的設定精靈、主畫面、設定頁。視覺風格在 theme.rs（跟網站同一套）
use crate::game::{self, BUILTIN};
use crate::i18n::{self, tr, trf};
use crate::jobs::{self, Fallback, Job, Outcome};
use crate::manifest::{self, ChangelogEntry, LauncherInfo, Manifest};
use crate::paths::{self, Config, DEFAULT_MANIFEST_URL};
use crate::selfupdate;
use crate::system::{self, D2Kind};
use crate::theme::{self, Tone, GOLD, GOLD_HI, IDLE, LINE_SOFT, MUTED, OK, TEXT, WARN};
use eframe::egui::{self, Color32, RichText, Stroke};
use std::path::PathBuf;
use std::sync::mpsc::{channel, Receiver, Sender};

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
    /// 上次啟動時翻譯套不上、改用原版
    fallback: Option<Fallback>,
    /// 最新一筆更新紀錄，和它是不是還沒看過
    changelog: Option<ChangelogEntry>,
    changelog_unseen: bool,
    game_version: Option<String>,
    /// 檢查更新失敗過（精靈的語言清單顯示離線說明、狀態列顯示黃點）
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
    icon: Option<egui::TextureHandle>,
    tx: Sender<Msg>,
    rx: Receiver<Msg>,
}

impl App {
    fn new(cc: &eframe::CreationContext, play: bool) -> Self {
        let config = Config::load();
        // 字型要先裝：樣式的標題用到 display 字型家族
        let font_lang = config.ui_language().to_string();
        theme::install_fonts(&cc.egui_ctx, &font_lang);
        theme::apply(&cc.egui_ctx);
        let (tx, rx) = channel();
        let manifest = manifest::cached();
        // 測試、截圖用：D2S_UI_PAGE=wizard1～wizard4｜main｜settings 直接開那一頁
        let page = match std::env::var("D2S_UI_PAGE").as_deref() {
            Ok(p) if p.starts_with("wizard") => Page::Wizard(p[6..].parse::<u8>().unwrap_or(1).clamp(1, WIZARD_STEPS) - 1),
            Ok("main") => Page::Main,
            Ok("settings") => Page::Settings,
            _ if config.wizard_done => Page::Main,
            _ => Page::Wizard(0),
        };
        let icon = cc.egui_ctx.load_texture(
            "icon",
            egui::ColorImage::from_rgba_unmultiplied([64, 64], include_bytes!("../assets/icon-64.rgba")),
            egui::TextureOptions::LINEAR,
        );
        let mut app = Self {
            page,
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
            font_lang,
            icon: Some(icon),
            tx,
            rx,
        };
        app.refresh_game();
        cc.egui_ctx.send_viewport_cmd(egui::ViewportCommand::Title(system::APP_NAME.into()));
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

    /// 語言清單：manifest 裡桌面版能用的翻譯，加上遊戲原本的英文、韓文。
    /// (id, 名稱, 狀態)：名稱和「測試中」都用那個語言自己寫，還沒選語言的人也看得懂
    fn languages(&self) -> Vec<(String, String, Option<&'static str>)> {
        let mut list = Vec::new();
        if let Some(m) = &self.manifest {
            for (l, _) in m.desktop_languages() {
                list.push((l.id.clone(), l.name.clone(), i18n::native_status(&l.id, l.status_key().map(|_| l.status.as_str()))));
            }
        }
        for (id, _) in BUILTIN {
            let (name, note) = if id == "en" { ("English", "original") } else { ("한국어", "원본") };
            list.push((id.to_string(), name.to_string(), Some(note)));
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
                            // 檢查更新失敗（離線之類）不跳錯誤，狀態列另外提示；精靈裡的語言清單也另外說明
                            if job != Job::Update {
                                self.error = Some(e);
                            }
                        }
                        // 改用原版開的話，留著視窗讓玩家看到原因
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

    fn section_label(ui: &mut egui::Ui, text: &str) {
        ui.label(RichText::new(text).small().color(MUTED));
    }

    /// 精靈：卡片格子一次列出所有語言（名稱大字、狀態小字，都用那個語言自己寫）。主畫面：下拉選單
    fn language_picker(&mut self, ui: &mut egui::Ui, combo: bool) {
        let languages = self.languages();
        if combo {
            let label = |name: &str, id: &str, note: Option<&str>| i18n::with_note(id, name, note);
            let selected = languages.iter().find(|(id, ..)| *id == self.config.language).map_or(self.config.language.clone(), |(id, n, s)| label(n, id, *s));
            egui::ComboBox::from_id_salt("language")
                .selected_text(RichText::new(selected).size(16.0).color(GOLD_HI))
                .width(ui.available_width())
                .height(360.0)
                .show_ui(ui, |ui| {
                    for (id, name, note) in &languages {
                        ui.selectable_value(&mut self.config.language, id.clone(), RichText::new(label(name, id, *note)).size(15.0));
                    }
                });
        } else {
            let gap = 10.0;
            let w = (ui.available_width() - gap) / 2.0;
            for row in languages.chunks(2) {
                ui.horizontal(|ui| {
                    ui.spacing_mut().item_spacing.x = gap;
                    for (id, name, note) in row {
                        let selected = self.config.language == *id;
                        let resp = theme::card(ui, egui::vec2(w, 54.0), selected, |ui, rect, hovered| {
                            let p = ui.painter();
                            let color = if selected || hovered { GOLD_HI } else { TEXT };
                            let x = rect.left() + 14.0;
                            match note {
                                Some(n) => {
                                    p.text(egui::pos2(x, rect.top() + 9.0), egui::Align2::LEFT_TOP, name, egui::FontId::proportional(17.0), color);
                                    p.text(egui::pos2(x, rect.bottom() - 9.0), egui::Align2::LEFT_BOTTOM, *n, egui::FontId::proportional(12.0), if selected { GOLD } else { MUTED });
                                }
                                None => {
                                    p.text(egui::pos2(x, rect.center().y), egui::Align2::LEFT_CENTER, name, egui::FontId::proportional(17.0), color);
                                }
                            }
                            if selected {
                                p.text(egui::pos2(rect.right() - 14.0, rect.center().y), egui::Align2::RIGHT_CENTER, "✔", egui::FontId::proportional(15.0), GOLD);
                            }
                        });
                        if resp.clicked() {
                            self.config.language = id.clone();
                        }
                    }
                });
                ui.add_space(4.0);
            }
        }
    }

    /// 語言選擇下面的說明：原版不會被標成 patched、語言要在遊戲裡切；翻譯版會被標成 patched
    fn mode_note(&self, ui: &mut egui::Ui) {
        if game::game_is_original(&self.config.language) {
            ui.label(RichText::new(self.t("original_note")).small().color(OK));
            ui.label(RichText::new(self.t("original_lang_hint")).small().color(MUTED));
        } else {
            ui.label(RichText::new(self.t("patched_note")).small().color(MUTED));
        }
    }

    fn path_row(ui: &mut egui::Ui, ok: bool, title: &str, detail: Option<String>) {
        theme::panel(ui, |ui| {
            ui.horizontal(|ui| {
                let (rect, _) = ui.allocate_exact_size(egui::vec2(26.0, 26.0), egui::Sense::hover());
                let color = if ok { OK } else { theme::ERR };
                ui.painter().circle_stroke(rect.center(), 11.0, Stroke::new(1.5, color));
                ui.painter().text(rect.center(), egui::Align2::CENTER_CENTER, if ok { "✔" } else { "✖" }, egui::FontId::proportional(13.0), color);
                ui.vertical(|ui| {
                    ui.label(RichText::new(title).size(16.0).color(TEXT));
                    if let Some(d) = detail {
                        ui.label(RichText::new(d).small().color(MUTED));
                    }
                });
            });
        });
    }

    /// 網站、Discord、贊助：小圖示加文字，不跳出、不擋啟動
    fn links(&self, ui: &mut egui::Ui) {
        ui.horizontal_wrapped(|ui| {
            ui.spacing_mut().item_spacing.x = 14.0;
            let link = |ui: &mut egui::Ui, icon: &str, text: &str, color: Color32| {
                let s = if icon.is_empty() { text.to_string() } else { format!("{icon} {text}") };
                ui.add(egui::Label::new(RichText::new(s).small().color(color)).sense(egui::Sense::click())).on_hover_cursor(egui::CursorIcon::PointingHand)
            };
            if link(ui, "🌐", self.t("site_short"), GOLD).clicked() {
                system::open_url(system::SITE_URL);
            }
            if !system::DISCORD_URL.is_empty() && link(ui, "💬", "Discord", GOLD).clicked() {
                system::open_url(system::DISCORD_URL);
            }
            if !system::DONATE_URL.is_empty() && link(ui, "", self.t("donate"), MUTED).clicked() {
                system::open_url(system::DONATE_URL);
            }
        });
    }

    // ── 設定精靈 ──

    fn wizard(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, step: u8) {
        let labels = [self.t("step_lang"), self.t("step_game"), self.t("step_d2"), self.t("step_done")];
        theme::steps(ui, &labels, step as usize);
        ui.add_space(10.0);
        match step {
            0 => {
                // 還沒選語言：不放標題和說明，只有 🌐 和語言按鈕（每個都用自己的語言寫）。選了之後下一步才用那個語言
                ui.vertical_centered(|ui| ui.label(RichText::new("🌐").size(26.0).color(GOLD)));
                ui.add_space(8.0);
                if self.manifest.is_none() {
                    if self.busy {
                        ui.horizontal(|ui| {
                            ui.spinner();
                            ui.label(self.t("lang_loading"));
                        });
                    } else if self.update_failed {
                        ui.colored_label(WARN, self.t("lang_offline"));
                    }
                    ui.add_space(6.0);
                }
                self.language_picker(ui, false);
            }
            1 => {
                ui.heading(RichText::new(self.t("game_title")).color(GOLD));
                ui.add_space(8.0);
                let dir = self.config.game_dir();
                if game::exists(&dir) {
                    let v = self.game_version.as_deref().map(|v| self.tf("game_version", &[v])).unwrap_or_default();
                    Self::path_row(ui, true, self.t("game_found"), Some(format!("{}  ·  {v}", system::display_path(&dir))));
                } else {
                    Self::path_row(ui, false, self.t("game_missing"), None);
                    ui.add_space(8.0);
                    ui.label(RichText::new(self.t("game_missing_desc")).color(MUTED));
                    ui.add_space(8.0);
                    if ui.button(RichText::new(format!("↗  {}", self.t("open_game_site"))).color(GOLD_HI)).clicked() {
                        system::open_url(system::GAME_URL);
                    }
                }
                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    if ui.button(format!("↻  {}", self.t("redetect"))).clicked() {
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
                ui.heading(RichText::new(self.t("d2_title")).color(GOLD));
                ui.label(RichText::new(self.t("d2_desc")).color(MUTED));
                ui.add_space(8.0);
                match self.d2() {
                    Some((dir, kind)) => {
                        let title = if kind == D2Kind::Resurrected { self.t("d2_found_d2r") } else { self.t("d2_found_classic") };
                        Self::path_row(ui, true, title, Some(system::display_path(&dir)));
                    }
                    None => {
                        Self::path_row(ui, false, self.t("d2_missing"), None);
                        ui.add_space(8.0);
                        ui.label(RichText::new(self.t("d2_missing_desc")).color(MUTED));
                        ui.add_space(8.0);
                        if ui.button(RichText::new(format!("↗  {}", self.t("open_blizzard"))).color(GOLD_HI)).clicked() {
                            system::open_url(system::D2R_URL);
                        }
                    }
                }
                ui.add_space(8.0);
                ui.horizontal(|ui| {
                    if ui.button(format!("↻  {}", self.t("redetect"))).clicked() {
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
                ui.heading(RichText::new(self.t("done_title")).color(GOLD));
                ui.label(RichText::new(self.t("done_desc")).color(MUTED));
                ui.add_space(14.0);
                let label = self.t("create_shortcut");
                ui.checkbox(&mut self.make_shortcut, label);
                ui.add_space(14.0);
                let enabled = !self.busy && game::exists(&self.config.game_dir());
                if theme::gold_button(ui, self.t("play"), 22.0, 54.0, enabled).clicked() {
                    self.finish_wizard(ctx);
                    self.start(Job::Launch, ctx);
                }
                ui.add_space(18.0);
                Self::section_label(ui, self.t("links"));
                self.links(ui);
            }
        }
    }

    /// 精靈底下的「上一步／下一步（略過）／完成」
    fn wizard_nav(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, step: u8) {
        let mut next: Option<Page> = None;
        ui.horizontal(|ui| {
            if step > 0 && ui.button(format!("‹  {}", self.t("back"))).clicked() {
                next = Some(Page::Wizard(step - 1));
            }
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                if step == WIZARD_STEPS - 1 {
                    if ui.button(RichText::new(self.t("finish")).color(GOLD_HI)).clicked() {
                        self.finish_wizard(ctx);
                    }
                    return;
                }
                let ok = match step {
                    1 => game::exists(&self.config.game_dir()),
                    2 => self.d2().is_some(),
                    _ => true,
                };
                let (label, color) = if ok { (self.t("next"), GOLD_HI) } else { (self.t("skip"), MUTED) };
                if ui.button(RichText::new(format!("{label}  ›")).color(color)).clicked() {
                    next = Some(Page::Wizard(step + 1));
                }
            });
        });
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
        let (tx, ctx) = (self.tx.clone(), ctx.clone());
        std::thread::spawn(move || {
            let _ = tx.send(Msg::Shortcut(system::create_shortcut().map_err(|e| format!("{e:#}"))));
            ctx.request_repaint();
        });
    }

    // ── 主畫面 ──

    fn main_page(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        self.banners(ui, ctx);
        ui.add_space(4.0);
        Self::section_label(ui, self.t("game_language"));
        ui.add_enabled_ui(!self.busy, |ui| self.language_picker(ui, true));
        ui.add_space(4.0);
        self.mode_note(ui);
        ui.add_space(16.0);

        let game_ok = game::exists(&self.config.game_dir());
        if theme::gold_button(ui, self.t("play"), 24.0, 58.0, !self.busy && game_ok).clicked() {
            if let Some(c) = &self.changelog {
                // 更新紀錄顯示著時按了啟動，就當成看過了
                let _ = jobs::mark_changelog_seen(&c.version);
                self.changelog_unseen = false;
            }
            self.start(Job::Launch, ctx);
        }
        // 進度：固定高度，訊息換來換去時版面不會跳。紀錄是繁中寫的，其他介面語言只顯示「處理中」
        ui.allocate_ui(egui::vec2(ui.available_width(), 22.0), |ui| {
            ui.horizontal(|ui| {
                if self.busy {
                    ui.spinner();
                    let text = match self.logs.last() {
                        Some(l) if self.ui_lang() == "zh-TW" => l.clone(),
                        _ => self.t("working").into(),
                    };
                    ui.label(RichText::new(text).small().color(MUTED));
                }
            });
        });
        ui.add_space(10.0);
        self.changelog_card(ui);
    }

    fn changelog_card(&mut self, ui: &mut egui::Ui) {
        let Some(c) = self.changelog.clone() else { return };
        let summary = c.summary_for(&self.ui_lang()).unwrap_or("").to_string();
        let mut seen = false;
        let (title, got, badge, unseen) = (self.t("changelog"), self.t("got_it"), self.t("new_badge"), self.changelog_unseen);
        theme::panel(ui, |ui| {
            ui.horizontal(|ui| {
                ui.label(RichText::new(title).font(theme::display_font(14.0)).color(GOLD));
                ui.label(RichText::new(&c.date).small().color(MUTED));
                if unseen {
                    egui::Frame::new().fill(GOLD).corner_radius(3).inner_margin(egui::Margin::symmetric(5, 0)).show(ui, |ui| {
                        ui.label(RichText::new(badge).small().color(theme::ON_GOLD));
                    });
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        seen = ui.small_button(got).clicked();
                    });
                }
            });
            ui.label(RichText::new(summary).color(TEXT));
        });
        if seen {
            let _ = jobs::mark_changelog_seen(&c.version);
            self.changelog_unseen = false;
        }
    }

    fn banners(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        if !game::exists(&self.config.game_dir()) {
            theme::banner(ui, Tone::Err, |ui| {
                ui.label(RichText::new(self.t("game_missing_banner")).color(TEXT));
            });
        }
        if let Some(f) = self.fallback {
            theme::banner(ui, Tone::Warn, |ui| {
                ui.label(RichText::new(self.t(f.key())).color(TEXT));
                ui.label(RichText::new(self.t("original_lang_hint")).small().color(MUTED));
            });
        }
        if let Some(e) = self.error.clone() {
            theme::banner(ui, Tone::Err, |ui| {
                ui.label(RichText::new(self.tf("error", &[&e])).color(TEXT));
            });
        }
        if let Some(n) = self.notice.clone() {
            theme::banner(ui, Tone::Ok, |ui| {
                ui.label(RichText::new(n).color(TEXT));
            });
        }
        if let Some(info) = self.launcher.clone().filter(|l| selfupdate::newer(&l.minimum)) {
            let (text, label, busy) = (self.tf("launcher_required", &[&info.minimum]), self.t("update_launcher"), self.busy);
            let mut go = false;
            theme::banner(ui, Tone::Warn, |ui| {
                ui.horizontal_wrapped(|ui| {
                    ui.label(RichText::new(text).color(TEXT));
                    go = ui.add_enabled(!busy, egui::Button::new(RichText::new(label).color(GOLD_HI))).clicked();
                });
            });
            if go {
                self.start(Job::SelfUpdate, ctx);
            }
        }
    }

    /// 主畫面底部：翻譯、遊戲、啟動器的狀態（綠點正常、黃點要注意），和連結
    fn footer(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        ui.horizontal_wrapped(|ui| {
            ui.spacing_mut().item_spacing.x = 5.0;
            let (tc, tv) = match (&self.manifest, self.update_failed) {
                (Some(m), false) => (OK, m.version.clone()),
                (Some(m), true) => (WARN, m.version.clone()),
                (None, _) => (IDLE, "—".into()),
            };
            theme::status_item(ui, tc, self.t("status_translation"), &tv);
            if self.update_failed {
                ui.label(RichText::new("⚠").small().color(WARN)).on_hover_text(self.t("update_failed"));
            }
            ui.add_space(8.0);
            let gv = self.game_version.clone();
            theme::status_item(ui, if gv.is_some() { OK } else { theme::ERR }, self.t("status_game"), gv.as_deref().unwrap_or("—"));
            ui.add_space(8.0);
            let newer = self.launcher.clone().filter(|l| selfupdate::newer(&l.latest));
            theme::status_item(ui, if newer.is_some() { WARN } else { OK }, self.t("status_launcher"), &format!("v{}", selfupdate::VERSION));
            if let Some(l) = newer {
                if ui.add_enabled(!self.busy, egui::Button::new(RichText::new(self.tf("launcher_new", &[&l.latest])).small().color(GOLD_HI)).small()).clicked() {
                    self.start(Job::SelfUpdate, ctx);
                }
            }
        });
        ui.add_space(2.0);
        ui.horizontal(|ui| {
            self.links(ui);
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                if ui.add_enabled(!self.busy, egui::Button::new(RichText::new(format!("↻ {}", self.t("check_updates"))).small()).small()).clicked() {
                    self.start(Job::Update, ctx);
                }
            });
        });
    }

    // ── 設定 ──

    fn settings_page(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        if let Some(n) = self.notice.clone() {
            theme::banner(ui, Tone::Ok, |ui| {
                ui.label(RichText::new(n).color(TEXT));
            });
        }
        if let Some(e) = self.error.clone() {
            theme::banner(ui, Tone::Err, |ui| {
                ui.label(RichText::new(self.tf("error", &[&e])).color(TEXT));
            });
        }
        theme::panel(ui, |ui| {
            Self::section_label(ui, self.t("game_folder"));
            ui.horizontal(|ui| {
                let hint = system::display_path(&paths::default_game_dir());
                let w = ui.available_width() - 140.0;
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
            Self::section_label(ui, self.t("d2_folder"));
            let text = self.d2().map_or(self.t("not_found").to_string(), |(d, _)| system::display_path(&d));
            ui.label(RichText::new(text).color(TEXT));
            ui.horizontal(|ui| {
                if ui.button(format!("↻  {}", self.t("detect"))).clicked() {
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
        });
        ui.add_space(8.0);
        theme::panel(ui, |ui| {
            Self::section_label(ui, self.t("update_source"));
            ui.add(egui::TextEdit::singleline(&mut self.config.manifest_url).hint_text(DEFAULT_MANIFEST_URL).desired_width(ui.available_width()));
            ui.add_space(6.0);
            let (auto, close) = (self.t("auto_update"), self.t("close_after"));
            ui.checkbox(&mut self.config.auto_update, auto);
            ui.checkbox(&mut self.config.close_after_launch, close);
        });
        ui.add_space(8.0);
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
        });
        ui.add_space(10.0);
        Self::section_label(ui, self.t("links"));
        self.links(ui);
        ui.add_space(8.0);
        egui::CollapsingHeader::new(RichText::new(self.t("cli")).color(MUTED)).show(ui, |ui| {
            ui.label(RichText::new(CLI_HELP).monospace().small());
        });
        // 標題字型 Cinzel 包在 exe 裡，OFL 要求授權文字跟著字型
        egui::CollapsingHeader::new(RichText::new(self.t("licenses")).color(MUTED)).show(ui, |ui| {
            ui.label(RichText::new("Cinzel — SIL Open Font License 1.1").small().color(TEXT));
            egui::ScrollArea::vertical().id_salt("ofl").max_height(160.0).show(ui, |ui| {
                ui.label(RichText::new(include_str!("../assets/fonts/OFL.txt")).small().color(MUTED));
            });
        });
        egui::CollapsingHeader::new(RichText::new(self.t("log")).color(MUTED)).show(ui, |ui| {
            egui::ScrollArea::vertical().max_height(160.0).stick_to_bottom(true).show(ui, |ui| {
                for l in &self.logs {
                    ui.label(RichText::new(l).small());
                }
            });
        });
    }

    // ── 標題列 ──

    fn header(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            if let Some(icon) = &self.icon {
                ui.add(egui::Image::new(egui::load::SizedTexture::new(icon.id(), [26.0, 26.0])));
            }
            ui.add_space(2.0);
            ui.label(RichText::new(system::APP_NAME).font(theme::display_font(20.0)).color(GOLD));
            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| match self.page {
                Page::Main => {
                    if ui.button(format!("⚙  {}", self.t("settings"))).clicked() {
                        self.page = Page::Settings;
                    }
                }
                Page::Settings => {
                    if ui.button(format!("‹  {}", self.t("return"))).clicked() {
                        let _ = self.config.save();
                        self.page = Page::Main;
                    }
                }
                Page::Wizard(_) => {}
            });
        });
    }
}

const CLI_HELP: &str = "d2s-launcher --launch [--lang zh-TW|zh-CN|ja|de|fr|ru|pl|en|ko] [--no-update]
d2s-launcher --play          (開視窗並直接啟動遊戲，桌面捷徑用這個)
d2s-launcher --install | --update | --restore | --self-update | --status
d2s-launcher --manifest <網址或路徑> --save";

fn bar_frame() -> egui::Frame {
    egui::Frame::new().fill(Color32::from_rgba_unmultiplied(19, 16, 13, 235)).inner_margin(egui::Margin::symmetric(16, 10))
}

impl eframe::App for App {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.handle_messages(ctx);
        // 介面語言換了：字型的順序跟著換（簡中優先用雅黑、宋體）
        let lang = self.ui_lang();
        if self.font_lang != lang {
            theme::install_fonts(ctx, &lang);
            self.font_lang = lang;
        }
        theme::paint_background(ctx);

        egui::TopBottomPanel::top("header").frame(bar_frame()).show_separator_line(false).show(ctx, |ui| self.header(ui));
        // 標題列下面的細線
        let line_y = ctx.available_rect().top();
        ctx.layer_painter(egui::LayerId::background()).hline(ctx.screen_rect().x_range(), line_y, Stroke::new(1.0, LINE_SOFT));

        match self.page {
            Page::Wizard(step) => {
                egui::TopBottomPanel::bottom("nav").frame(bar_frame()).show_separator_line(false).show(ctx, |ui| self.wizard_nav(ui, ctx, step));
            }
            Page::Main => {
                egui::TopBottomPanel::bottom("footer").frame(bar_frame()).show_separator_line(false).show(ctx, |ui| self.footer(ui, ctx));
            }
            Page::Settings => {}
        }

        egui::CentralPanel::default().frame(egui::Frame::new().inner_margin(egui::Margin::symmetric(20, 14))).show(ctx, |ui| {
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

pub fn run(play: bool) -> eframe::Result {
    // 測試用的 D2S_UI_ZOOM 連視窗一起放大，跟 Windows 的 125%、150% 縮放一樣
    let zoom = std::env::var("D2S_UI_ZOOM").ok().and_then(|z| z.parse::<f32>().ok()).unwrap_or(1.0);
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([580.0 * zoom, 620.0 * zoom])
            .with_min_inner_size([480.0, 500.0])
            .with_title(system::APP_NAME)
            // 跟網站一樣的「D2」圖示（assets/make-icon.ps1 產生）
            .with_icon(egui::IconData { rgba: include_bytes!("../assets/icon-64.rgba").to_vec(), width: 64, height: 64 }),
        ..Default::default()
    };
    eframe::run_native(system::APP_NAME, options, Box::new(move |cc| Ok(Box::new(App::new(cc, play)))))
}
