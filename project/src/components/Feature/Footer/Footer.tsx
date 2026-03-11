import type { FC } from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

export const Footer: FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.copyright}>
          © {new Date().getFullYear()} All rights reserved
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <ul className={styles.linksList}>
            <li>
              <Link to="/about" className={styles.link}>
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className={styles.link}>
                Contact
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={styles.link}>
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
};
