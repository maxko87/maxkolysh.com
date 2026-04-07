import { Link } from 'react-router-dom';

function NomImage({ name, title }: { name: string; title?: string }) {
  return (
    <div style={{ textAlign: 'center', margin: '1.5em 0' }} title={title || ''}>
      <img src={`/images/nominology/nomin_${name}.png`} alt={`Nominology chart for ${name}`} />
    </div>
  );
}

function StartupNamesPage() {
  return (
    <div className="blog-container">
      <nav className="back-link">
        <Link to="/">← Back</Link>
      </nav>

      <article className="blog-post">
        <h3>&ldquo;Startup Names&rdquo; by Paul Graham, 14 Mar 2006</h3>

        <p>
          <em>
            [This essay was also hard for me to find online &mdash; it got deleted from the internet at some point. I pulled it from the{' '}
            <a href="https://web.archive.org/web/20120806163542/aux.messymatters.com/pgnames.html" target="_blank" rel="noopener noreferrer">Wayback Machine</a>{' '}
            (<a href="https://web.archive.org/web/20120806163542id_/http://aux.messymatters.com:80/pgnames.html" target="_blank" rel="noopener noreferrer">original</a>)
            and put it here so it doesn&rsquo;t disappear again. &mdash;max]
          </em>
        </p>

        <p>
          <em>
            [This was originally published on the now-defunct Infogami and was surprisingly hard to find online, so I put it here.
            I&rsquo;ve added commentary, with our now internet-decades of hindsight, in brackets.
            I&rsquo;ve also summarized the names mentioned (and alluded to) along 7 dimensions:
            Evocativity, Brevity, Greppability, Googlability, Pronounceability, Spellability, and Verbability.
            These are discussed in my own article, &ldquo;Nominology&rdquo;.
            &mdash;dreeves]
          </em>
        </p>

        <p>
          One of the hardest problems new startups face is choosing a name.
          All the good domain names seem to be taken &mdash; and not by other companies, but by domain squatters.
        </p>

        <p>
          The good news is, the feeling that all the good names are taken is an illusion.
          It must be, because I felt it in 1995.
          Squatters have registered huge numbers of names, certainly, but they can&rsquo;t register names as fast as 26<sup>n</sup> grows.
        </p>

        <NomImage name="viaweb" title="Viaweb is not only reasonbly verbable, it stands alone as an adverbial phrase" />

        <p>
          Because so many names have been taken by squatters, a strange new phenomenon has arisen.
          It&rsquo;s now uncool to have a name that was obviously bought from squatters.
          It&rsquo;s like running Microsoft software on your servers.
          <em>[Like StackOverflow, launched in 2008, does!]</em>{' '}
          It suggests you have more money than brains, and that&rsquo;s not a good thing for a startup brand to suggest.
        </p>

        <NomImage name="microsoft" title="Microsoft is short for microcomputer software, in case you're as slow as I was; presumably that was obvious in the 70s" />

        <NomImage name="stackoverflow" />

        <p>
          Hence names like Flickr, Writely <em>[acquired by Google and became Google Docs]</em>, and Del.icio.us.
          These are the stars of recent startupdom, and yet they&rsquo;re living in decidedly marginal name space.
          It&rsquo;s a bit like when fashionable people started living in lofts in industrial neighborhoods.
        </p>

        <NomImage name="flickr" title="Flickr never seems to get verbed but it could be, perhaps with the form 'to flick'" />

        <NomImage name="yahoo" title="Yahoo is of course googlable today but from the perspective of choosing new names, anything that's a dictionary word isn't very unique" />

        <NomImage name="google" title="'Google' falls short on spellability since it's a mispelling of the existing word 'googol'" />

        <h4>Nothing could be less cool than calling a startup &ldquo;cool.com&rdquo;</h4>

        <p>
          And as happened with lofts, the features that initially repelled people, like rough concrete walls, have now become a badge of coolness.
          Weird names are now cool, if they&rsquo;re the right kind of weird.
          Nothing could be less cool, at this point, than calling a startup &ldquo;cool.com.&rdquo;
          A company with a name like that could not have arisen organically.
          &ldquo;Cool.com&rdquo; smells of a media conglomerate trying to create a web spinoff.
        </p>

        <NomImage name="coolcom" title="It's also terrible because you pretty much have to treat the '.com' as part of the name" />

        <p>
          In a world where all the obvious names are taken, finding a good name is a test of imagination.
          And the name you choose tells whether or not you passed that test.
        </p>

        <p>
          My favorite recent startup name is probably Writely.
          It looks so natural that even though it isn&rsquo;t a word, you feel it should be.
          Anyone thoughtful enough to come up with a name like that is probably going to have good software.
          <em>[As noted above, they were in fact massively successful.]</em>
        </p>

        <NomImage name="writely" title="Writely falls short on spellability only because it's pronounced identically to an actual English word" />

        <p>
          The best kind of names are the ones that are both cool words and refer to what the company does, like Writely.
          The second grade of names are merely cool words, like Del.icio.us.
          This is enough.
          If the startups we fund manage to get this far, we&rsquo;re happy.
        </p>

        <NomImage name="delicious" title="Some of these depend on whether you consider the name to be 'Delicious' or 'del.icio.us'" />

        <p>
          The next grade of names are ones that are mediocre but not actively repulsive.
          Even these tend to be good enough in practice, because names soon take on a tint of whatever they refer to.
          So if you make something good, its name will start to seem pleasing.
        </p>

        <p>
          I hated the name Reddit <em>[acquired by Conde Nast and still going strong, though seemingly taken over by teenage boys]</em> at first, for example, and made them promise to change it.
          Steve Huffman agreed with me and said he would. But not Alexis.
          And now it looks like Alexis has won.
          Reddit is now Reddit permanently.
          I&rsquo;ll admit the name has one advantage: when people ask me where I heard something, I find myself naturally saying &ldquo;I read it on Reddit.&rdquo;
        </p>

        <NomImage name="reddit" title="Borderline green on evocativity for both 'read it' and 'edit' connotations" />

        <p>
          Among the startups we&rsquo;ve funded, the one whose name I like most hasn&rsquo;t quite launched yet, so I can&rsquo;t mention it.
          <em>[<a href="http://www.reddit.com/comments/338f/startup_names_paul_graham" target="_blank" rel="noopener noreferrer">Apparently</a> it was YouOS.]</em>{' '}
          My second favorite is probably Textpayme <em>[acquired by Amazon.com soon after this was written]</em>.
          As many people have mentioned, it&rsquo;s good to have a name that works as a verb, so users can start saying e.g. &ldquo;Google such-and-such.&rdquo;
          But Textpayme shows that you can also do this by making your name a whole sentence.
          Indeed, there are several ways to get the verb effect: in Flagr <em>[apparently now dead]</em>, for example, you &ldquo;flag&rdquo; things.
        </p>

        <NomImage name="youos" />

        <NomImage name="textpayme" />

        <NomImage name="amazon" title="Amazon is of course googlable today but from the perspective of choosing new names, anything that's a dictionary word isn't very unique" />

        <NomImage name="flagr" title="Despite the obvious 'to flag' I feel this doesn't quite count as a verbing of 'Flagr' since it's a common, preexisting verb" />

        <p>
          Infogami <em>[the blogging platform where Paul Graham posted this, now dead]</em> is a pretty decent name too.
          Aaron already had that when we first met him.
          It can&rsquo;t conveniently be used as a verb, but it looks and sounds good, and has the advantage that it can naturally expand to cover whatever this software evolves into.
        </p>

        <NomImage name="infogami" title="'Infogami' might count as evocative for a company that sliced and diced and repackaged data -- origami for information" />

        <p>
          My least favorite name is probably Wufoo <em>[recently acquired by SurveyMonkey and still going strong]</em>.
          But I love the founders, and they&rsquo;ve made something pretty fabulous.
          All the other startups are in awe of their design sense.
          So this will be a test of how powerful associations are.
          Will we one day say &ldquo;Wufoo&rdquo; with the same relish that we now say &ldquo;Ferrari&rdquo; or &ldquo;Bang &amp; Olufsen?&rdquo;
          Hard to imagine, but we&rsquo;ll know in about six months.
        </p>

        <NomImage name="wufoo" title="'Wufoo' is probably short and pronounceable enough to be verbable but arguably sounds to ridiculous" />

        <NomImage name="surveymonkey" />

        <p>
          Whatever name you choose, be careful. Names stick.
          You need a way to refer to things, and whatever you call something rapidly becomes its name.
          So if you&rsquo;re not sure what to call a startup, either call it &ldquo;our startup,&rdquo; or choose a name so terrible that you&rsquo;re not tempted to keep it.
          The startup whose name I like most originally called themselves &ldquo;Webshaka.&rdquo; That did the job.
        </p>

        <NomImage name="webshaka" />

        <p>
          <em><a href="http://news.ycombinator.com/item?id=3180593" target="_blank" rel="noopener noreferrer">Discuss this article on Hacker News</a></em>
        </p>

        <p className="post-footer">
          <em>Originally published by Paul Graham on Infogami, March 14, 2006. Commentary by dreeves.</em>
        </p>
      </article>
    </div>
  );
}

export default StartupNamesPage;
