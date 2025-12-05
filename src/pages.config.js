import Saved from './pages/Saved';
import IntelligenceFeed from './pages/IntelligenceFeed';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Saved": Saved,
    "IntelligenceFeed": IntelligenceFeed,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Saved",
    Pages: PAGES,
    Layout: __Layout,
};