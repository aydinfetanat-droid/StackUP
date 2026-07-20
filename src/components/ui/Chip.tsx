interface Props {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function Chip({ children, active = false, onClick }: Props) {
  return (
    <button onClick={onClick} className={`chip tap ${active ? "chip-active" : ""}`}>
      {children}
    </button>
  );
}
