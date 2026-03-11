import { Link, useNavigate } from 'react-router-dom';
import { Title } from '../Title';
import styles from './PageHeader.module.scss';
import { Typography } from '../Typography';
import type { FC } from 'react';
import { Button } from '../Button';

type PageHeaderProps = {
  title: string;
  link: string;
};
export const PageHeader: FC<PageHeaderProps> = ({ title, link }) => {
  const navigate = useNavigate();
  return (
    <div className={styles.header}>
      <Button
        variant="primary"
        size="small"
        onClick={() => navigate(-1)}
        className={styles.backButton}
      >
        Назад
      </Button>
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
