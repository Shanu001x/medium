import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  }
}>();

blogRouter.use('/*', async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if(user) {
        c.set("userId", user.id)
       await next();
    } else{
        return c.json({
            message: "You are not logged in"
        })
    }
})

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const authorId = c.get("userId")
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: authorId,
    },
  });

  return c.json({
    id: post.id,
  });
});

blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const post = await prisma.post.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return c.json({
    id: post.id,
    post
  });
});


blogRouter.get("/bulk", async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
  
    const post = await prisma.post.findMany();
    return c.json({
      post,
    });
  });
  


blogRouter.get("/:id", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const id =  c.req.param("id");

    const post = await prisma.post.findFirst({
      where: {
        id: id,
      },
    });

    return c.json({
      post,
    });
  } catch (error) {
    c.status(411);
    return c.json({
      message: "Error while fetching the blog ",
    });
  }
});
