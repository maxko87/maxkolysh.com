import { Link } from 'react-router-dom';

function RequestIntrosPage() {
  return (
    <div className="blog-container">
      <nav className="back-link">
        <Link to="/">← Back</Link>
      </nav>

      <article className="blog-post">
        <h3>How to Request Intros</h3>

        <p>People often ask me for introductions, whether it's hiring managers asking for candidate referrals, other startup founders asking for intros to investors, or my portfolio companies asking for intros to prospective customers.</p>

        <p>Here's a request from an investor update I got recently:</p>

        <blockquote>
          <p>If you want to help:</p>
          <p>We'd greatly appreciate intros to founders, COOs, or CPOs, or heads of growth at any of these companies: StitchFix, ThredUp, [10 more companies], TrunkClub.</p>
        </blockquote>

        <p>The problem is that this relies on recall instead of recognition. I'm sure I know some prospects that match the criteria, but it's tough to think of them off the top of my head.</p>

        <p>Luckily, LinkedIn's advanced search makes it dead simple to request intros and take the mental burden off the person you're asking. Before you request an intro:</p>

        <ol>
          <li>On the LinkedIn homepage, click the search bar, and select "People".</li>
          <li>Click "All Filters".</li>
          <li>Select "1st" for "Connections" and fill out the "Current Companies", "Industries", and/or "Title" fields for the demographic you want intros to. You can use OR clauses in the job title to select multiple at once.</li>
          <li>Click "Apply" to get the search results link. The magical thing about the search results is that they are customized to whoever is viewing them. The URL will look something like this: <code>https://www.linkedin.com/search/results/people/?currentCompany=%5B%221441%22%2C%2210667%22%2C%221035%22%5D&network=%5B%22F%22%5D&origin=FACETED_SEARCH&title=software%20engineer%20OR%20account%20manager</code></li>
          <li>Send that link to everyone you're requesting intros from. All they have to do is open the link and they'll instantly see everyone who they can introduce you to. (Note that the recipient might have to click on the empty search bar and then hit "enter" to re-run the search).</li>
          <li>Once you've identified who you want intros to, make it easy for your contact by sending them <a href="https://also.roybahat.com/introductions-and-the-forward-intro-email-14e2827716a1" target="_blank" rel="noopener noreferrer">forward intro emails</a>.</li>
        </ol>

        <p>This approach is especially useful when requesting intros from many people at once, or when you're trying to get in touch with people at a wide variety of companies.</p>

        <p>Happy networking!</p>

        <p className="post-footer">
          <em>Originally published on <a href="https://maxkolysh.medium.com/use-this-linkedin-hack-to-10x-conversions-on-your-intro-requests-8cdeea97006d" target="_blank" rel="noopener noreferrer">Medium</a> on November 22, 2019</em>
        </p>
      </article>
    </div>
  );
}

export default RequestIntrosPage;
