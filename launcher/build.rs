// 把圖示（assets/icon.ico，make-icon.ps1 產生）和檔案說明放進 exe。
// 名稱跟 src/system.rs 的 APP_NAME 一樣：D2 Survivors Localization（每種語言都一樣，不翻譯）
fn main() {
    println!("cargo:rerun-if-changed=assets/icon.ico");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        let mut res = winresource::WindowsResource::new();
        res.set_icon("assets/icon.ico");
        res.set("FileDescription", "D2 Survivors Localization");
        res.set("ProductName", "D2 Survivors Localization");
        res.compile().expect("無法把圖示放進 exe");
    }
}
