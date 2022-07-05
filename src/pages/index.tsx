import { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

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
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState(postsPagination.results);

  const handleLoadMorePosts = async () => {
    const data = await fetch(postsPagination.next_page).then(res => res.json());

    if (data.next_page) {
      setNextPage(data.next_page);
    } else {
      setNextPage(null);
    }

    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
    console.log(posts);
  };

  return (
    <div>
      <img src="/images/Logo.svg" alt="Logo" />
      {posts.map((post, key) => {
        return (
          <div key={key}>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
            <div>
              <time>{post.first_publication_date}</time>
              <span>{post.data.author}</span>
              <span>{postsPagination.next_page}</span>
            </div>
          </div>
        );
      })}
      {nextPage && (
        <span onClick={handleLoadMorePosts}>Carregar mais posts</span>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 1,
  });
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  console.log(posts);
  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
