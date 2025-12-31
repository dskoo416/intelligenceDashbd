import Documents from './pages/Documents';
import Home from './pages/Home';
import IntelligenceFeed from './pages/IntelligenceFeed';
import Saved from './pages/Saved';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Documents": Documents,
    "Home": Home,
    "IntelligenceFeed": IntelligenceFeed,
    "Saved": Saved,
}

export const pagesConfig = {
    mainPage: "Saved",
    Pages: PAGES,
    Layout: __Layout,
};