import Navbar from "./components/Navbar";
import "./globals.css";
import "@fontsource/inter";

export const metadata = {
  title: "Wildfire Visualizer",
  description: "Visualize wildfire data with ease!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
