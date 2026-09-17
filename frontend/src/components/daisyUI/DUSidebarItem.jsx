import { NavLink } from "react-router-dom";

export const DUSidebarItem = (
  iconOrProps,
  label,
  destination,
  logoutSubmit = null,
  iconColor = "text-[#555555]",
  className = ""
) => {
  let Icon = iconOrProps;
  let itemLabel = label;
  let itemDestination = destination;
  let onLogout = logoutSubmit;
  let color = iconColor;
  let customClass = className;

  // Support JSX prop object usage: <DUSidebarItem icon={FaHome} label="Inicio" ... />
  if (iconOrProps && typeof iconOrProps === "object" && !iconOrProps.$$typeof && !iconOrProps._context) {
    Icon = iconOrProps.icon;
    itemLabel = iconOrProps.label;
    itemDestination = iconOrProps.destination;
    onLogout = iconOrProps.logoutSubmit || null;
    color = iconOrProps.iconColor || "text-[#555555]";
    customClass = iconOrProps.className || "";
  }

  const renderIcon = () => {
    if (!Icon) return null;
    if (typeof Icon === "function") {
      return <Icon className={`size-4 shrink-0 ${color}`} />;
    }
    return <span className={`shrink-0 ${color}`}>{Icon}</span>;
  };

  return (
    <li className="w-full list-none border-b border-[#eceff1]">
      <NavLink
        to={itemDestination}
        onClick={onLogout}
        className={({ isActive }) =>
          `flex items-center w-full px-4 py-2.5 text-left transition-colors duration-150 ${
            isActive && itemDestination !== "/login"
              ? "bg-[#e2edf8] text-[#14375c] font-medium border-l-4 border-l-[#2F4697]"
              : "text-[#444444] hover:bg-[#ebf2f7] hover:text-[#14375c]"
          } ${customClass}`
        }
        title={String(itemLabel)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {renderIcon()}
          <span className="text-[13.5px] font-normal truncate tracking-tight text-[#444444] is-drawer-close:hidden">
            {String(itemLabel)}
          </span>
        </div>
      </NavLink>
    </li>
  );
};

export default DUSidebarItem;