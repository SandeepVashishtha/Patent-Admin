import "./globals.css";

export const metadata = {
  title: "Patent Admin Portal",
  description: "Admin-only portal for Patent IPR backend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
