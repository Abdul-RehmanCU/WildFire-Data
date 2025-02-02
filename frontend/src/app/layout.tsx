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
        <main className="pt-14 p-4 md:pt-4 md:ml-64">
          {children}
        </main>
      </body>
    </html>
  );
}
