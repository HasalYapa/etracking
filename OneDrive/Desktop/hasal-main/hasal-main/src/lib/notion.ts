import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const databaseId = process.env.NOTION_DATABASE_ID!

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  published: boolean
  publishedAt: string
  tags: string[]
  coverImage?: string
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return []
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Published',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: 'Published At',
          direction: 'descending',
        },
      ],
    })

    const posts = response.results.map((page: any) => {
      const properties = page.properties
      return {
        id: page.id,
        title: properties.Title?.title[0]?.plain_text || '',
        slug: properties.Slug?.rich_text[0]?.plain_text || '',
        excerpt: properties.Excerpt?.rich_text[0]?.plain_text || '',
        content: '', // Would need to fetch page content separately
        published: properties.Published?.checkbox || false,
        publishedAt: properties['Published At']?.date?.start || '',
        tags: properties.Tags?.multi_select.map((tag: any) => tag.name) || [],
        coverImage: properties['Cover Image']?.files[0]?.external?.url || properties['Cover Image']?.files[0]?.file?.url,
      }
    })

    return posts
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return null
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: 'Slug',
            rich_text: {
              equals: slug,
            },
          },
          {
            property: 'Published',
            checkbox: {
              equals: true,
            },
          },
        ],
      },
    })

    if (response.results.length === 0) {
      return null
    }

    const page = response.results[0] as any
    const properties = page.properties

    // Fetch page content
    const pageContent = await notion.blocks.children.list({
      block_id: page.id,
    })

    // Convert blocks to markdown (simplified)
    const content = pageContent.results
      .map((block: any) => {
        if (block.type === 'paragraph') {
          return block.paragraph.rich_text.map((text: any) => text.plain_text).join('')
        }
        return ''
      })
      .join('\n\n')

    return {
      id: page.id,
      title: properties.Title?.title[0]?.plain_text || '',
      slug: properties.Slug?.rich_text[0]?.plain_text || '',
      excerpt: properties.Excerpt?.rich_text[0]?.plain_text || '',
      content,
      published: properties.Published?.checkbox || false,
      publishedAt: properties['Published At']?.date?.start || '',
      tags: properties.Tags?.multi_select.map((tag: any) => tag.name) || [],
      coverImage: properties['Cover Image']?.files[0]?.external?.url || properties['Cover Image']?.files[0]?.file?.url,
    }
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
} 