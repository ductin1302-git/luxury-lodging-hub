import SearchBar from "./SearchBar";

const HotelsHero = () => {
  return (
    <div className="pt-20 pb-6 bg-gradient-navy relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="animate-fade-in-down" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <SearchBar />
        </div>
      </div>
    </div>
  );
};

export default HotelsHero;
