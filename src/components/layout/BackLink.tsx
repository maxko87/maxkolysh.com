import { Link } from 'react-router-dom';

function BackLink() {
  return (
    <nav className="mb-8">
      <Link to="/" className="text-gray-500 hover:text-gray-700 transition-colors">
        ← Back
      </Link>
    </nav>
  );
}

export default BackLink;
