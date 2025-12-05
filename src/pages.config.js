import Home from './pages/Home';
import Saved from './pages/Saved';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Saved": Saved,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};