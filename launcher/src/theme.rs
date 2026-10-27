// 啟動器的視覺風格：跟網站（site/style.css 開頭的變數）同一套顏色和字型。
// 不用暴雪或遊戲本身的圖、Logo、字型：標題字型是 Cinzel（OFL，assets/fonts/），背景是自己畫的漸層
use eframe::egui::{self, Color32, CornerRadius, FontFamily, FontId, Rect, Response, RichText, Sense, Stroke, StrokeKind, Ui, Vec2};
use std::path::PathBuf;

const fn hex(v: u32) -> Color32 {
    Color32::from_rgb((v >> 16) as u8, (v >> 8) as u8, v as u8)
}

pub const BG: Color32 = hex(0x0c0a08);
pub const BG2: Color32 = hex(0x13100d);
pub const PANEL: Color32 = hex(0x18140f);
pub const LINE: Color32 = hex(0x3a3026);
pub const LINE_SOFT: Color32 = hex(0x2a231c);
pub const GOLD: Color32 = hex(0xc9a45c);
pub const GOLD_HI: Color32 = hex(0xead39a);
pub const TEXT: Color32 = hex(0xddd3c2);
pub const MUTED: Color32 = hex(0x9b907f);
pub const OK: Color32 = hex(0x7cc36a);
pub const WARN: Color32 = hex(0xd9a23f);
pub const IDLE: Color32 = hex(0x6f665a);
pub const ERR: Color32 = hex(0xe07a5f);
/// 金色按鈕上的深色字
pub const ON_GOLD: Color32 = hex(0x1a1206);
pub const RADIUS: u8 = 6;

/// 標題字型家族：Cinzel，中日韓、西里爾字母退回系統的襯線字型
pub fn display() -> FontFamily {
    FontFamily::Name("display".into())
}

pub fn display_font(size: f32) -> FontId {
    FontId::new(size, display())
}

pub fn apply(ctx: &egui::Context) {
    let mut v = egui::Visuals::dark();
    v.panel_fill = Color32::TRANSPARENT;
    v.window_fill = PANEL;
    v.window_stroke = Stroke::new(1.0, LINE);
    v.window_corner_radius = CornerRadius::same(RADIUS);
    v.menu_corner_radius = CornerRadius::same(RADIUS);
    v.extreme_bg_color = BG2;
    v.faint_bg_color = BG2;
    v.code_bg_color = BG2;
    v.hyperlink_color = GOLD;
    v.warn_fg_color = WARN;
    v.error_fg_color = ERR;
    v.selection.bg_fill = hex(0x5a4522);
    v.selection.stroke = Stroke::new(1.0, GOLD_HI);
    let w = &mut v.widgets;
    let r = CornerRadius::same(RADIUS);
    w.noninteractive.bg_fill = PANEL;
    w.noninteractive.weak_bg_fill = PANEL;
    w.noninteractive.bg_stroke = Stroke::new(1.0, LINE_SOFT);
    w.noninteractive.fg_stroke = Stroke::new(1.0, TEXT);
    w.noninteractive.corner_radius = r;
    w.inactive.bg_fill = PANEL;
    w.inactive.weak_bg_fill = PANEL;
    w.inactive.bg_stroke = Stroke::new(1.0, LINE);
    w.inactive.fg_stroke = Stroke::new(1.0, TEXT);
    w.inactive.corner_radius = r;
    w.hovered.bg_fill = hex(0x221c15);
    w.hovered.weak_bg_fill = hex(0x221c15);
    w.hovered.bg_stroke = Stroke::new(1.0, GOLD);
    w.hovered.fg_stroke = Stroke::new(1.5, GOLD_HI);
    w.hovered.corner_radius = r;
    w.hovered.expansion = 0.0;
    w.active.bg_fill = hex(0x2a2117);
    w.active.weak_bg_fill = hex(0x2a2117);
    w.active.bg_stroke = Stroke::new(1.0, GOLD_HI);
    w.active.fg_stroke = Stroke::new(1.5, GOLD_HI);
    w.active.corner_radius = r;
    w.active.expansion = 0.0;
    w.open.bg_fill = BG2;
    w.open.weak_bg_fill = BG2;
    w.open.bg_stroke = Stroke::new(1.0, GOLD);
    w.open.fg_stroke = Stroke::new(1.0, TEXT);
    w.open.corner_radius = r;
    ctx.set_visuals(v);
    ctx.style_mut(|s| {
        s.spacing.item_spacing = egui::vec2(8.0, 6.0);
        s.spacing.button_padding = egui::vec2(12.0, 5.0);
        s.spacing.interact_size.y = 26.0;
        s.text_styles.insert(egui::TextStyle::Heading, display_font(21.0));
        s.text_styles.insert(egui::TextStyle::Body, FontId::proportional(14.5));
        s.text_styles.insert(egui::TextStyle::Button, FontId::proportional(14.5));
        s.text_styles.insert(egui::TextStyle::Small, FontId::proportional(12.0));
    });
    // 測試用：模擬 Windows 的 125%、150% 縮放（D2S_UI_ZOOM=1.25）
    if let Some(z) = std::env::var("D2S_UI_ZOOM").ok().and_then(|z| z.parse::<f32>().ok()) {
        ctx.set_zoom_factor(z);
    }
}

/// 字型：內文 Segoe UI，標題 Cinzel；中日韓文用 Windows 的系統字型。
/// 依介面語言排順序，簡中優先用雅黑（字形才是簡體的寫法），標題的中文用明體／宋體
pub fn install_fonts(ctx: &egui::Context, ui_lang: &str) {
    let mut fonts = egui::FontDefinitions::default();
    let dir = std::env::var_os("WINDIR").map(PathBuf::from).unwrap_or_else(|| "C:\\Windows".into()).join("Fonts");
    let mut load = |name: &str, file: &str| -> Option<String> {
        let bytes = std::fs::read(dir.join(file)).ok()?;
        fonts.font_data.insert(name.into(), egui::FontData::from_owned(bytes).into());
        Some(name.to_string())
    };
    let (cjk, cjk_serif) = match ui_lang {
        "zh-CN" => (vec![load("yahei", "msyh.ttc"), load("jhenghei", "msjh.ttc")], load("simsun", "simsun.ttc")),
        "ja" => (vec![load("yugothic", "YuGothM.ttc"), load("jhenghei", "msjh.ttc")], load("mingliu", "mingliu.ttc")),
        _ => (vec![load("jhenghei", "msjh.ttc")], load("mingliu", "mingliu.ttc")),
    };
    let segoe = load("segoe", "segoeui.ttf");
    let georgia = load("georgia", "georgia.ttf");
    let hangul = load("malgun", "malgun.ttf");
    fonts.font_data.insert("cinzel".into(), egui::FontData::from_static(include_bytes!("../assets/fonts/Cinzel-Latin-SemiBold.ttf")).into());
    fonts.font_data.insert("cinzel-ext".into(), egui::FontData::from_static(include_bytes!("../assets/fonts/Cinzel-LatinExt-SemiBold.ttf")).into());
    let emoji = ["NotoEmoji-Regular".to_string(), "emoji-icon-font".to_string()];

    // 日文介面整行都用遊ゴシック（連拉丁字母、數字）：Segoe UI 和遊ゴシック的基線不一樣，混在一行裡英數字會忽高忽低
    let body: Vec<String> = if ui_lang == "ja" {
        cjk.iter().flatten().cloned().chain(segoe.clone()).chain(hangul.clone()).chain(emoji.clone()).chain(["Ubuntu-Light".into()]).collect()
    } else {
        segoe.iter().cloned().chain(cjk.iter().flatten().cloned()).chain(hangul.clone()).chain(emoji.clone()).chain(["Ubuntu-Light".into()]).collect()
    };
    let title: Vec<String> = ["cinzel".to_string(), "cinzel-ext".to_string()]
        .into_iter()
        .chain(georgia)
        .chain(cjk_serif)
        .chain(cjk.iter().flatten().cloned())
        .chain(hangul)
        .chain(emoji)
        .collect();
    let mono: Vec<String> = ["Hack".to_string()].into_iter().chain(body.iter().cloned()).collect();
    // 遊ゴシック的行高比較高，字會偏上：往下移一點，按鈕和欄位裡才會置中
    if let Some(f) = fonts.font_data.get_mut("yugothic") {
        let mut d = (**f).clone();
        d.tweak.y_offset_factor = 0.12;
        *f = d.into();
    }
    fonts.families.insert(FontFamily::Proportional, body);
    fonts.families.insert(FontFamily::Monospace, mono);
    fonts.families.insert(display(), title);
    ctx.set_fonts(fonts);
}

/// 視窗背景：由上往下的深色漸層，上方中間一點金色的光
pub fn paint_background(ctx: &egui::Context) {
    let rect = ctx.screen_rect();
    let painter = ctx.layer_painter(egui::LayerId::background());
    let mut mesh = egui::Mesh::default();
    let (top, bottom) = (hex(0x17120d), BG);
    mesh.colored_vertex(rect.left_top(), top);
    mesh.colored_vertex(rect.right_top(), top);
    mesh.colored_vertex(rect.right_bottom(), bottom);
    mesh.colored_vertex(rect.left_bottom(), bottom);
    mesh.add_triangle(0, 1, 2);
    mesh.add_triangle(0, 2, 3);
    // 金色光暈：扇形，中心半透明，邊緣透明
    let c = egui::pos2(rect.center().x, rect.top());
    let (rx, ry) = (rect.width() * 0.6, rect.height() * 0.45);
    let base = mesh.vertices.len() as u32;
    mesh.colored_vertex(c, Color32::from_rgba_unmultiplied(201, 164, 92, 22));
    let n = 32;
    for i in 0..=n {
        let a = std::f32::consts::PI * i as f32 / n as f32;
        mesh.colored_vertex(egui::pos2(c.x + rx * a.cos(), c.y + ry * a.sin()), Color32::TRANSPARENT);
    }
    for i in 0..n {
        mesh.add_triangle(base, base + 1 + i, base + 2 + i);
    }
    painter.add(egui::Shape::mesh(mesh));
}

/// 金底深色字的主要按鈕（像網站的下載按鈕），有 hover 和按下的狀態
pub fn gold_button(ui: &mut Ui, text: &str, size: f32, height: f32, enabled: bool) -> Response {
    let width = ui.available_width();
    let (rect, resp) = ui.allocate_exact_size(Vec2::new(width, height), if enabled { Sense::click() } else { Sense::hover() });
    let fill = if !enabled {
        hex(0x4a3f2c)
    } else if resp.is_pointer_button_down_on() {
        hex(0xb08d48)
    } else if resp.hovered() {
        GOLD_HI
    } else {
        GOLD
    };
    let p = ui.painter();
    // 底下一點陰影，按下時往下移一點
    let pressed = enabled && resp.is_pointer_button_down_on();
    let r = if pressed { rect.translate(Vec2::new(0.0, 1.0)) } else { rect };
    if !pressed {
        p.rect_filled(rect.translate(Vec2::new(0.0, 2.0)), RADIUS, Color32::from_black_alpha(120));
    }
    p.rect_filled(r, RADIUS, fill);
    p.rect_stroke(r, RADIUS, Stroke::new(1.0, if enabled { GOLD_HI } else { LINE }), StrokeKind::Inside);
    let color = if enabled { ON_GOLD } else { MUTED };
    p.text(r.center(), egui::Align2::CENTER_CENTER, text, display_font(size), color);
    if enabled {
        resp.on_hover_cursor(egui::CursorIcon::PointingHand)
    } else {
        resp
    }
}

/// 可以點的卡片（語言選擇）：選到的用金色邊框
pub fn card(ui: &mut Ui, size: Vec2, selected: bool, add: impl FnOnce(&mut Ui, Rect, bool)) -> Response {
    let (rect, resp) = ui.allocate_exact_size(size, Sense::click());
    let hovered = resp.hovered();
    let (fill, stroke) = if selected {
        (hex(0x231b10), Stroke::new(1.5, GOLD))
    } else if hovered {
        (hex(0x1e1812), Stroke::new(1.0, hex(0x6b5532)))
    } else {
        (PANEL, Stroke::new(1.0, LINE_SOFT))
    };
    let p = ui.painter();
    p.rect_filled(rect, RADIUS, fill);
    p.rect_stroke(rect, RADIUS, stroke, StrokeKind::Inside);
    add(ui, rect, hovered);
    resp.on_hover_cursor(egui::CursorIcon::PointingHand)
}

/// 面板（設定的分組、更新紀錄）
pub fn panel<R>(ui: &mut Ui, add: impl FnOnce(&mut Ui) -> R) -> R {
    egui::Frame::new()
        .fill(PANEL)
        .stroke(Stroke::new(1.0, LINE_SOFT))
        .corner_radius(RADIUS)
        .inner_margin(egui::Margin::symmetric(12, 10))
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            add(ui)
        })
        .inner
}

#[derive(Clone, Copy)]
pub enum Tone {
    Ok,
    Warn,
    Err,
}

/// 提示條：左邊一條色帶
pub fn banner(ui: &mut Ui, tone: Tone, add: impl FnOnce(&mut Ui)) {
    let (accent, fill) = match tone {
        Tone::Ok => (OK, hex(0x15200f)),
        Tone::Warn => (WARN, hex(0x261d0e)),
        Tone::Err => (ERR, hex(0x2a1512)),
    };
    let resp = egui::Frame::new()
        .fill(fill)
        .stroke(Stroke::new(1.0, accent.gamma_multiply(0.45)))
        .corner_radius(RADIUS)
        .inner_margin(egui::Margin { left: 14, right: 10, top: 8, bottom: 8 })
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            add(ui);
        });
    let r = resp.response.rect;
    ui.painter().rect_filled(Rect::from_min_max(r.left_top(), egui::pos2(r.left() + 3.0, r.bottom())), CornerRadius { nw: RADIUS, sw: RADIUS, ne: 0, se: 0 }, accent);
    ui.add_space(6.0);
}

/// 狀態圓點加文字
pub fn status_item(ui: &mut Ui, color: Color32, label: &str, value: &str) {
    let (rect, _) = ui.allocate_exact_size(Vec2::splat(8.0), Sense::hover());
    ui.painter().circle_filled(rect.center(), 3.5, color);
    ui.label(RichText::new(label).small().color(MUTED));
    ui.label(RichText::new(value).small().color(TEXT));
}

/// 精靈上方的步驟：①語言 — ②遊戲 — ③Diablo II — ④完成，目前的用金色
pub fn steps(ui: &mut Ui, labels: &[&str], current: usize) {
    let width = ui.available_width();
    let (rect, _) = ui.allocate_exact_size(Vec2::new(width, 46.0), Sense::hover());
    let p = ui.painter();
    let n = labels.len();
    let seg = width / n as f32;
    let cy = rect.top() + 13.0;
    for i in 0..n {
        let cx = rect.left() + seg * (i as f32 + 0.5);
        if i + 1 < n {
            let color = if i < current { GOLD } else { LINE };
            p.line_segment([egui::pos2(cx + 15.0, cy), egui::pos2(cx + seg - 15.0, cy)], Stroke::new(1.0, color));
        }
        let c = egui::pos2(cx, cy);
        let (fill, stroke, num) = if i == current {
            (GOLD, GOLD_HI, ON_GOLD)
        } else if i < current {
            (PANEL, GOLD, GOLD)
        } else {
            (PANEL, LINE, MUTED)
        };
        p.circle_filled(c, 11.0, fill);
        p.circle_stroke(c, 11.0, Stroke::new(1.0, stroke));
        let mark = if i < current { "✔".to_string() } else { (i + 1).to_string() };
        p.text(c, egui::Align2::CENTER_CENTER, mark, FontId::proportional(12.0), num);
        let lc = if i == current { GOLD_HI } else if i < current { GOLD } else { MUTED };
        p.text(egui::pos2(cx, cy + 22.0), egui::Align2::CENTER_CENTER, labels[i], FontId::proportional(12.0), lc);
    }
}
