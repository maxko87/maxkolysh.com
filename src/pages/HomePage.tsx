import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="home-container">
      <main>
        <section>
          <h2>Work</h2>
          <div className="links">
            <a href="https://dover.com" target="_blank" rel="noopener noreferrer">
              Dover
            </a>
            <a href="https://zinc.com" target="_blank" rel="noopener noreferrer">
              Zinc
            </a>
          </div>
        </section>

        <section>
          <h2>Projects</h2>
          <div className="links">
            <a href="https://feelme.app" target="_blank" rel="noopener noreferrer">
              Feel Me
            </a>
            <a href="https://maxkolysh.com/learn" target="_blank" rel="noopener noreferrer">
              Learned League Study Guide
            </a>
            <Link to="/gp-comp">Fund GP Comp Calculator</Link>
          </div>
        </section>

        <section>
          <h2>Writing</h2>
          <div className="links">
            <Link to="/why-vcs-hate-recruiting-startups">
              Why VCs Hate Recruiting Startups
            </Link>
            <Link to="/how-to-request-intros">How to Request Intros</Link>
          </div>
        </section>

        <section>
          <h2>Contact</h2>
          <div className="links">
            <a
              href="mailto:maxkolysh@gmail.com"
              onClick={(e) => {
                window.open('mailto:maxkolysh@gmail.com', 'mail');
                e.preventDefault();
              }}
            >
              maxkolysh@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/maxkolysh/"
              target="_blank"
              rel="noopener noreferrer"
            >
              linkedin.com/in/maxkolysh
            </a>
            <a
              href="https://www.twitter.com/maxkolysh"
              target="_blank"
              rel="noopener noreferrer"
            >
              twitter.com/maxkolysh
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
