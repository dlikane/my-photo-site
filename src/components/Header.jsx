import Menu from "./Menu";

const Header = ({ theme, setTheme }) => {
    return (
        <header className="relative flex flex-col items-center text-black dark:text-white py-6 bg-white dark:bg-black">
            <Menu theme={theme} setTheme={setTheme} />
            <div className="text-center">
                <h1 className="text-[35.2px] sm:text-[28.8px] tracking-[10px] sm:tracking-[20px] lowercase overflow-hidden text-ellipsis font-light font-title">
                    Dmitry&nbsp;&middot;&nbsp;Likane
                </h1>
                <p className="text-[19.2px] font-light mt-1">with</p>
            </div>
        </header>
    );
};

export default Header;
