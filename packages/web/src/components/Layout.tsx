import { Outlet } from 'react-router-dom';
import { Bot, GitBranch, MessageSquare, History } from 'lucide-react';

const navItems = [
  { icon: Bot, label: 'Agents', href: '/' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
  { icon: History, label: 'History', href: '/history' },
  { icon: GitBranch, label: 'Repos', href: '/repos' },
];

export function Layout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6 text-mc-primary" />
            multiclaude
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-800 text-sm text-gray-500">
          multiclaude-ui v0.1.0
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
