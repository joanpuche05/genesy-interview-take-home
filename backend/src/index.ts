import { createApp } from './app'

const app = createApp()

app.listen(4000, () => {
  console.log('Express server is running on port 4000')
})
