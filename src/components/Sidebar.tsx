
import React from 'react';
import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  DollarSign,
  Home, 
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-nepal-primary text-white w-64 z-30 transform transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-nepal-primary/20">
          {/* <h2 className="text-lg font-bold">
            MKS Educational Institute
          </h2> */}

            <div className="flex justify-center w-full">
            <img 
              src="/img/logo.png" 
              alt="MKS Educational Institute" 
              className="h-12 w-auto rounded-md" 
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)} 
            className="md:hidden text-white hover:bg-nepal-primary/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="px-2 py-4">
          <ul className="space-y-1">
            <SidebarItem to="/" icon={<Home />} text="Dashboard" />
            <SidebarItem to="/students" icon={<User />} text="Students" />
            <SidebarItem to="/fee-collection" icon={<DollarSign />} text="Fee Collection" />
            <SidebarItem to="/reports" icon={<Calendar />} text="Monthly Reports" />
          </ul>
          
          <Separator className="my-4 bg-nepal-primary/20" />
          
          <div className="px-3 py-2">
            <h3 className="text-sm font-medium text-gray-200 mb-2">Nepali Months</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashoj",
                "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
              ].map((month) => (
                <div key={month} className="flex items-center py-1">
                  <ChevronRight className="h-3 w-3 mr-1 text-gray-400" />
                  <span>{month}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, text }) => {
  return (
    <li>
      <NavLink 
        to={to} 
        className={({ isActive }) => cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
          isActive 
            ? "bg-white/10 text-white" 
            : "text-gray-200 hover:bg-white/5 hover:text-white"
        )}
      >
        <span className="text-xl">{icon}</span>
        <span>{text}</span>
      </NavLink>
    </li>
  );
};

export default Sidebar;
