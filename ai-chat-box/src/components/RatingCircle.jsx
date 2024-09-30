const RatingCircle = ({ rating }) => {
    const normalizedRating = Math.min(Math.max(rating, 1), 10);
    const percentage = (normalizedRating - 1) / 9 * 100;
    const color = `hsl(${percentage * 1.2}, 100%, 50%)`;
  
    return (
      <svg width="25" height="25" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#e0e0e0" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${percentage * 1.13}, 100`}
          transform="rotate(-80 20 20)"
        />
        <text className="font-bold" x="20" y="25" textAnchor="middle" fontSize="16" fill="#333">
          {normalizedRating}
        </text>
      </svg>
    );
  };

  export default RatingCircle;