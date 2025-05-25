
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatNepaliDate } from "@/lib/nepali-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { LogOut, Menu } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface HeaderProps {
  toggleSidebar: () => void;
}


dayjs.extend(utc);

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const isMobile = useIsMobile();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 sticky top-0 z-10">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mr-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-medium text-nepal-primary">
          MKS Educational Institute
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:inline">
            Today: {formatNepaliDate(new Date().toISOString())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
