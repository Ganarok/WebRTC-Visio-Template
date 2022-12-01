const Loader = () => {

    return (
        <div className="flex relative items-center justify-center p-2 w-12 h-12 rounded-xl bg-rtc-turquoise animate-spin">
            <div className="h-full w-full bg-rtc-black rounded-xl"/>

            <div className="absolute h-2 w-2 rounded-sm bg-rtc-turquoise animate-spin animate-pulse animate-ping" />
        </div>
    )
}

export default Loader