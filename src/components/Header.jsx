import Menu from "./Menu";

const Header = ({ theme, setTheme }) => {
    return (
        <header className="relative flex flex-col items-center bg-white py-6 text-black dark:bg-black dark:text-white">
            <Menu theme={theme} setTheme={setTheme} />
            <div className="text-center">
                <h1 className="overflow-hidden text-ellipsis font-title text-[35.2px] font-light lowercase tracking-[10px] sm:text-[28.8px] sm:tracking-[10px]">
                    Dmitry&nbsp;&middot;&nbsp;Likane
                </h1>
                <p className="mt-1 text-[19.2px] font-light">with</p>
            </div>
        </header>
    );
};

export default Header;
