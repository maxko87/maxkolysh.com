interface BlogPostProps {
  children: React.ReactNode;
}

function BlogPost({ children }: BlogPostProps) {
  return (
    <article className="prose prose-lg max-w-none">
      {children}
    </article>
  );
}

export default BlogPost;
