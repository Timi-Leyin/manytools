import { Input } from "@/components/modified-ui/input";
import tools from "@/tools";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as SolarIconSet from "solar-icon-set";
import { useTheme } from "@/context/theme-provider";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <header className="flex sticky top-0 left-0 justify-between items-center gap-4 p-3 py-4 backdrop-blur-md border-b border-border z-10">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">
              ManyTools{" "}
              <span className="px-2 py-1 rounded-full border text-xs">
                v0.1
              </span>{" "}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-400 text-xs font-semibold">
              A growing collection of essential design, development, and
              everyday tools — all in one place.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-lg border border-border"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div className="md:block hidden">
            <Input
              placeholder="Search Tools..."
              leftIcon={<SolarIconSet.Magnifer />}
            />
          </div>
        </div>
      </header>
      <div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {tools.map((tool, index) => (
            <Link
              key={index}
              to={tool.route}
              className="p-6 border relative border-black/20 dark:border-whi hover:border-foreground transition-colors rounded-lg flex items-center justify-between flex-col gap-4"
            >
              <tool.icon size={40} iconStyle="LineDuotone" color="currentColor" />
              <p className="text-center font-semibold text-sm">
                {tool.title}
              </p>
              {/* {tool.wip && <Badge>Coming Soon</Badge>} */}
            </Link>
          ))}

          <button className="p-6 border border-border bg-accent text-accent-foreground rounded-lg flex items-center justify-between flex-col cursor-pointer gap-4">
            <SolarIconSet.WidgetAdd size={40} />
            <p className="font-semibold text-sm">
              Request New Tool
            </p>
          </button>
        </div>
      </div>
    </>
  );
}
