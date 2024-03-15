import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from 'hono'
import {sign, verify} from 'hono/jwt'
import { createPostInput, updatePostInput } from '@shez100x/easytypes'

// missing: hashing, Admin Route, "pagination imp bit"
// Create the main Hono app
export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	},
    Variables: {
        userId: string,
    }
}>();

blogRouter.use('api/v1/blog', async(c, next)=>{
    const header = c.req.header("authorization") || " ";
    const token = header.split(" ")[1]
    const user = await verify(token, c.env.JWT_SECRET)
    if(user){
        c.set('userId', user.id)
        await next()
    }else{
      c.status(401)
      return c.json({
        error: "authentication faled out",
      })
    }
  })
 
blogRouter.post('/', async (c) => {
	const authtorId = c.get('userId');
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
    const {success} = createPostInput.safeParse(body.data);
    if(!success){
        c.status(400)
        return  c.json({
            success: false,
            message: "Invalid input"
            })
    }
	const post = await prisma.post.create({
		data: {
			title: body.data.title,
			content: body.data.content,
			authorId: authtorId,
		}
	});
	return c.json({
		id: post.id
	});
})

blogRouter.put('/update', async(c) =>{

	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
    const {success} = updatePostInput.safeParse(body);
    if(!success){
        c.status(400)
        return  c.json({
            success: false,
            message: "Invalid input"
            })
    }
	const post = await prisma.post.update({
		where: {
            id: body.id,
        },
        data: {
            title: body.title,
            content: body.content
        }
	})
	return c.json({
        msg:"post updated successfully",
        post,
    });
})

// todo: Pagination

blogRouter.get('/bulk', async(c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
  
    const posts = await prisma.post.findMany({
        select:{
            title:true,
            content:true,
            id:true,
            author:{
                select:{
                    firstname:true,
                }
            }
        }
    })
    return c.json({posts})
})

blogRouter.get('/:id', async(c) => {
    const id = c.req.param('id')
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    
    try{
        const post = await prisma.post.findFirst({
            where: {
                id: String(id)
            },select:{
                id:true,
                title:true,
                content:true,
                author:{
                    select:{
                        firstname:true,
                    }
                }
            }
        })

        return c.json({post});
    }catch(e){
        c.status(404)
        return c.json({
            error: "post not found"
        })
    }
    
})

export default blogRouter;