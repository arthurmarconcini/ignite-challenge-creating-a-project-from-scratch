import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import { formatDate } from './../utils/date';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  const handleLoadMorePosts = async () => {
    const data = await fetch(nextPage).then(res => res.json());

    if (data.next_page) {
      setNextPage(data.next_page);
    } else {
      setNextPage(null);
    }

    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  };

  return (
    <div className={`${commonStyles.container} ${styles.container}`}>
      <img className={styles.logo} src="/images/Logo.svg" alt="Logo" />
      {posts.map((post, key) => {
        return (
          <Link key={key} href={`/post/${post.uid}`}>
            <a className={styles.content}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={styles.details}>
                <time>
                  <FiCalendar size={20} strokeWidth={2.4} />
                  {formatDate(post.first_publication_date)}
                </time>
                <span>
                  <FiUser size={20} strokeWidth={2.4} />
                  {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        );
      })}
      {nextPage && (
        <span className={styles.loadButton} onClick={handleLoadMorePosts}>
          Carregar mais posts
        </span>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 5,
  });
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};
