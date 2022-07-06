import { GetStaticPaths, GetStaticProps } from 'next';
import * as Prismic from '@prismicio/helpers';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { formatDate } from '../../utils/date';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string | null;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const [minutes] = useState(() => {
    const minutesToRead = post.data.content.reduce((acc, content) => {
      const text = content.body.reduce((acc, { text }) => {
        return acc + text;
      }, '');

      return acc + text.split(' ').length + content.heading.split(' ').length;
    }, 0);

    return Math.round(minutesToRead / 200) + 1;
  });

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div
          className={styles.banner}
          style={{ backgroundImage: `url(${post.data.banner.url})` }}
        />
        <div className={commonStyles.container}>
          <div className={styles.postHeader}>
            <h1>{post.data.title}</h1>
            <div className={styles.info}>
              <time>
                <FiCalendar size={20} strokeWidth={2.4} />
                {formatDate(post.first_publication_date)}
              </time>
              <span>
                <FiUser size={20} strokeWidth={2.4} />
                {post.data.author}
              </span>
              <span>
                <FiClock size={20} strokeWidth={2.4} />
                {minutes} min
              </span>
            </div>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map((content, index) => {
              return (
                <article key={index}>
                  <h2>{content.heading}</h2>
                  {content.body.map((paragraph, index) => {
                    return <p key={index}>{paragraph.text}</p>;
                  })}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');
  const paths = posts.results.slice(0, 4).map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID<any>('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body.map(body => {
            return {
              text: body.text,
            };
          }),
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};
