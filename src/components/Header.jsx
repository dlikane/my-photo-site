import Menu from "./Menu";

const Header = () => {
    return (
        <header className="relative flex flex-col items-center text-white py-6 bg-black">
            <Menu />
            <div className="title-wrapper">
                <h1
                    className="text-[35.2px] sm:text-[28.8px] tracking-[10px] sm:tracking-[20px] lowercase text-center whitespace-nowrap overflow-hidden text-ellipsis font-[100]"
                    style={{
                        fontFamily: '"Big Shoulders", "Futura", "Gill Sans", "Helvetica Neue", sans-serif',
                        fontVariant: "small-caps"
                    }}
                >
                    Dmitry&nbsp;&middot;&nbsp;Likane
                </h1>
            </div>
            <p
                className="text-[19.2px] font-[50] mt-1"
                style={{
                    fontFamily: '"Big Shoulders", "Futura", "Gill Sans", "Helvetica Neue", sans-serif'
                }}
            >
                with
            </p>
        </header>
    );
};

export default Header;