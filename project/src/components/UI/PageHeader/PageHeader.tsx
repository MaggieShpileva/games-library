import { Link } from 'react-router-dom';
import { Title } from '../Title';
import styles from './PageHeader.module.scss';
import { Typography } from '../Typography';
import type { FC } from 'react';

type PageHeaderProps = {
  title: string;
  link: string;
};
export const PageHeader: FC<PageHeaderProps> = ({ title, link }) => {
  return (
    <div className={styles.header}>
      <Title tag="h2" className={styles.title}>
        {title}
      </Title>
      <Link to={link} target="_blank" className={styles.link}>
        <Typography variant="regular" className={styles.linkText}>
          Исходный проект
        </Typography>
      </Link>
    </div>
  );
};
