// Metric 1: Average Rating by Industry
function calculateAverageRatingByIndustry(companies) {
  const ratingsByIndustry = {};

  companies.forEach(company => {
    const industry = company.category?.toLowerCase();
    const rating = parseFloat(company.stars);

    if (!isNaN(rating) && industry) { // Check if industry is defined and not an empty string
      if (!ratingsByIndustry[industry]) {
        ratingsByIndustry[industry] = { total: 0, count: 0 };
      }

      ratingsByIndustry[industry].total += rating;
      ratingsByIndustry[industry].count += 1;
    }
  });

  const averageRatings = {};

  for (const industry in ratingsByIndustry) {
    const { total, count } = ratingsByIndustry[industry];
    averageRatings[industry] = total / count;
  }

  return averageRatings;
}

  
  // Metric 2: Reviews Distribution
  function calculateReviewsDistribution(companies) {
    const reviewsDistribution = {};
  
    companies.forEach(company => {
      const numReviews = parseInt(company.numReviews);
  
      if (!isNaN(numReviews)) {
        if (!reviewsDistribution[numReviews]) {
          reviewsDistribution[numReviews] = 0;
        }
  
        reviewsDistribution[numReviews] += 1;
      }
    });
  
    return reviewsDistribution;
  }


  
  
// Metric 3: Top N Companies with High Ratings and Many Reviews
function getHighlyRatedAndReviewedCompanies(companies, minRating = 4.5, minReviews = 20, topN = 5) {
  const validCompanies = companies.filter(company => {
      const rating = parseFloat(company.stars);
      const numReviews = parseInt(company.numReviews);

      // Check for NaN and null values
      const isValidRating = !isNaN(rating);
      const isValidNumReviews = !isNaN(numReviews);

      // Filter companies based on criteria
      return isValidRating && isValidNumReviews && rating >= minRating && numReviews >= minReviews;
  });

  // Sort companies based on rating (stars)
  const sortedCompanies = validCompanies.sort((a, b) => {
      // You can modify this comparison based on your specific metric
      const ratingA = parseFloat(a.stars);
      const ratingB = parseFloat(b.stars);

      return ratingB - ratingA;
  });

  // Return the top N companies (default to top 5)
  return sortedCompanies.slice(0, topN);
}
  
  
 // Metric 4: Popular Categories
function getPopularCategories(companies, numCategories = 5) {
  const categoryCounts = {};

  companies.forEach(company => {
    const category = company.category?.toLowerCase() || '';

    if (!categoryCounts[category]) {
      categoryCounts[category] = 0;
    }

    categoryCounts[category] += 1;
  });

  const sortedCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);

  const popularCategories = sortedCategories.slice(0, numCategories);
  const categoryCountsResult = popularCategories.map(category => ({ category, count: categoryCounts[category] }));

  // Calculate count for "others" category
  const othersCount = Object.keys(categoryCounts).filter(category => !popularCategories.includes(category))
    .reduce((acc, category) => acc + categoryCounts[category], 0);

  categoryCountsResult.push({ category: 'others', count: othersCount });

  return categoryCountsResult;
}

// Metric 5: Least Popular Categories
function getLeastPopularCategories(companies, numCategories = 5) {
  const categoryCounts = {};

  companies.forEach(company => {
    const category = company.category?.toLowerCase() || '';

    if (!categoryCounts[category]) {
      categoryCounts[category] = 0;
    }

    categoryCounts[category] += 1;
  });

  const sortedCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[a] - categoryCounts[b]);

  const leastPopularCategories = sortedCategories.slice(0, numCategories);
  const categoryCountsResult = leastPopularCategories.map(category => ({ category, count: categoryCounts[category] }));

  // Calculate count for "others" category
  const othersCount = Object.keys(categoryCounts).filter(category => !leastPopularCategories.includes(category))
    .reduce((acc, category) => acc + categoryCounts[category], 0);

  categoryCountsResult.push({ category: 'others', count: othersCount });

  return categoryCountsResult;
}

  // Metric 6: Least Reviewed Companies
  function getLeastReviewedCompanies(companies, maxReviews = 5) {
    return companies.filter(company => {
      const numReviews = parseInt(company.numReviews);
      return !isNaN(numReviews) && numReviews <= maxReviews;
    });
  }

  
  function getMetrics(companiesData){
    const averageRatingsByIndustry = calculateAverageRatingByIndustry(companiesData);
    const reviewsDistribution = calculateReviewsDistribution(companiesData);
    const highlyRatedAndReviewedCompanies = getHighlyRatedAndReviewedCompanies(companiesData);
    const leastReviewedCompanies = getLeastReviewedCompanies(companiesData);
    const popularCategories = getPopularCategories(companiesData);
    const unpopularCategories = getLeastPopularCategories(companiesData);

    return {
        averageRatingsByIndustry,
        reviewsDistribution,
        leastReviewedCompanies,
        highlyRatedAndReviewedCompanies,
        popularCategories,
        unpopularCategories,

    };
  };

  

  const metrics = {
    calculateAverageRatingByIndustry,
    calculateReviewsDistribution,
    getHighlyRatedAndReviewedCompanies,
    getPopularCategories,
    getLeastReviewedCompanies,
    getLeastPopularCategories,
    getMetrics,
    
  }

  export default metrics;