import Home from './pages/Home';
import Saved from './pages/Saved';
import IntelligenceFeed from './pages/IntelligenceFeed';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Saved": Saved,
    "IntelligenceFeed": IntelligenceFeed,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};