export default function Home() {
  return (
    <div className="portfolio-page">
      <div className="portfolio-hero">
        <div className="hero-content">
          <div className="logo-large">
            <span className="logo-icon">🚀</span>
            <h1 className="logo-text">GAZI UZAY</h1>
          </div>
          <p className="hero-subtitle">Gazi Üniversitesi Uzay ve Havacılık Topluluğu</p>
          <div className="hero-actions">
            <a href="/login" className="btn-primary">Üye Girişi</a>
            <a href="#about" className="btn-secondary">Hakkımızda</a>
          </div>
        </div>
      </div>
      
      <section id="about" className="portfolio-section">
        <h2>Hakkımızda</h2>
        <p>Uzay teknolojileri ve havacılık alanında çalışan öğrenci topluluğu</p>
      </section>
      
      <section className="portfolio-section">
        <h2>Projelerimiz</h2>
        <div className="project-grid">
          <div className="project-card">
            <h3>Uydu Projesi</h3>
            <p>CubeSat geliştirme çalışmaları</p>
          </div>
          <div className="project-card">
            <h3>Roket Projesi</h3>
            <p>Model roket tasarım ve üretimi</p>
          </div>
        </div>
      </section>
    </div>
  )
}