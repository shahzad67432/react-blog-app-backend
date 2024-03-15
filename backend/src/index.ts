import { Hono } from 'hono'
import { cors } from 'hono/cors'
import userRouter from './routes/user'
import blogRouter from './routes/blog'
// Create the main Hono app
const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	}
}>();

app.use(cors())
app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)


// using middleware in the way that hono provides



export default app;
