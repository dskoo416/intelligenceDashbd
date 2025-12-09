import Saved from './pages/Saved';
import IntelligenceFeed from './pages/IntelligenceFeed';
import Home from './pages/Home';
import Documents from './pages/Documents';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Saved": Saved,
    "IntelligenceFeed": IntelligenceFeed,
    "Home": Home,
    "Documents": Documents,
}

export const pagesConfig = {
    mainPage: "Saved",
    Pages: PAGES,
    Layout: __Layout,
};