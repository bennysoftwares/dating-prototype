import { NavLink } from 'react-router';
import { NAV_ITEMS } from '../../app/navigation';
import { Logo } from '../brand/Logo';
import { Icon } from '../ui/Icon';
import './BottomNav.css';

/**
 * Primary navigation. A bottom tab bar on phones; a left rail on wide screens.
 * Padding respects the iPhone home indicator via safe-area insets.
 */
export function BottomNav({ badges = {} }: { badges?: Partial<Record<string, number>> }) {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__brand">
        <Logo showName={false} />
      </div>
      <ul className="nav__list" role="list">
        {NAV_ITEMS.map((item) => {
          const count = badges[item.to] ?? 0;
          return (
            <li key={item.to}>
              <NavLink to={item.to} className="nav__item">
                {({ isActive }) => (
                  <>
                    <span className="nav__icon">
                      <Icon name={item.icon} filled={isActive} size={24} />
                      {count > 0 && <span className="nav__badge" aria-hidden="true" />}
                    </span>
                    <span className="nav__label">{item.label}</span>
                    {count > 0 && <span className="visually-hidden">, {count} new</span>}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
