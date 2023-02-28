// src/mocks/handlers.js
import { rest } from 'msw'

export const handlers = [
    rest.get('/this-does-not-exist', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({msg: 'This does not exist!'})
        )
    }),
  ]
