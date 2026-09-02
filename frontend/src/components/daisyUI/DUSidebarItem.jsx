import { NavLink } from "react-router-dom";

export const DUSidebarItem = (icon, label, destination, logoutSubmit = null, className = "") => {
    return (
        <div>
            {/* List item */}
            <li className="mb-1">
            <NavLink to={destination} onClick={logoutSubmit}>
            <button className={`is-drawer-close:tooltip is-drawer-close:tooltip-right ${className}`} data-tip={String(label)}>
                <div className="content-center-safe items-center-safe place-self-center align-middle flex flex-row">
                    {icon()}
                    <span className="is-drawer-close:hidden ml-1">{String(label)}</span>
                </div>
            </button>
            </NavLink>
            </li>
        </div>      
    )
}