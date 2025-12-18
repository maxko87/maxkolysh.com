interface ContainerProps {
  children: React.ReactNode;
}

function Container({ children }: ContainerProps) {
  return (
    <div className="max-w-content mx-auto px-6 pt-[120px] pb-6">
      {children}
    </div>
  );
}

export default Container;
