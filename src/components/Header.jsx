import Menu from "./Menu";

const Header = () => {
    return (
        <header className="header">
            <Menu/>
            <div className="title-wrapper">
                <h1 className="title">Dmitry&nbsp;&middot;&nbsp;Likane</h1>
            </div>
            <p className="tagline">with</p>
        </header>
    );
};

export default Header;
