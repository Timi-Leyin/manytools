import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { WorkerProvider } from "@/context/worker-provider";
import "react-tooltip/dist/react-tooltip.css";

export const Route = createRootRoute({
  component: () => (
    <WorkerProvider maxConcurrentWorkers={3}>
      <div className="max-w-7xl mx-auto p-6">
        <HeadContent />
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </WorkerProvider>
  ),
});
