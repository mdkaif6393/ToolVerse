import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Home,
  Users,
  FolderOpen,
  FileText,
  Brain,
  BarChart3,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Shield,
  History,
} from "lucide-react";

const baseNavigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Tools", href: "/dashboard/tools", icon: Brain },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavigationItems = [
  { name: "Audit Logs", href: "/dashboard/audit-logs", icon: History },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const isActive = (href: string) => location.pathname === href;
  
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } bg-card border-r border-border h-screen flex flex-col transition-all duration-300 dark:bg-black dark:border-white/10`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between dark:border-white/10">
        {!isCollapsed && (
          <Link to="/dashboard" className="flex items-center">
            <span className="text-xl font-bold gradient-text dark:text-white">SaaS Tools</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {baseNavigationItems.map((item, index) => (
            <Link key={index} to={item.href}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"} ${
                  isActive(item.href) ? "bg-primary text-primary-foreground dark:bg-primary dark:shadow-glow" : "dark:hover:bg-white/10"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          ))}
          
          {/* Admin Section */}
          {isAdmin && (
            <>
              {!isCollapsed && (
                <div className="px-3 py-2">
                  <Separator className="my-2" />
                  <p className="text-xs font-semibold text-muted-foreground">ADMIN</p>
                </div>
              )}
              {adminNavigationItems.map((item, index) => (
                <Link key={`admin-${index}`} to={item.href}>
                  <Button
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isCollapsed ? "px-2" : "px-3"} ${
                      isActive(item.href) ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Button>
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border dark:border-white/10">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};