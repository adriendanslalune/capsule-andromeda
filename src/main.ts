import { mount } from 'svelte'
import './theme/theme.css'
import './interface/base.css'
import './interface/modules/modules.css'
import App from './interface/App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
