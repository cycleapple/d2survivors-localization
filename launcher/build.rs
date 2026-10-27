// 把圖示（assets/icon.ico，make-icon.ps1 產生）放進 exe
fn main() {
    println!("cargo:rerun-if-changed=assets/icon.ico");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        let mut res = winresource::WindowsResource::new();
        res.set_icon("assets/icon.ico");
        res.compile().expect("無法把圖示放進 exe");
    }
}
