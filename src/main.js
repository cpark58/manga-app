import "../style.css";

const ENDPOINT_COMPLETIONS = "https://api.openai.com/v1/chat/completions";
const ENDPOINT_IMAGES = "https://api.openai.com/v1/images/generations";

let API_KEY;

async function getBlurb(title, theme) {
  try {
    //make the api request
    const response = await fetch(ENDPOINT_COMPLETIONS, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }, 
      body: JSON.stringify({
        model: "gpt-3.5-turbo", 
        messages: [
          {role: "system", content: "You are a helpful assistant."}, 
          {role: "user", content: `Create a manga blurb with the title "${title}" and theme "${theme}"`}
        ], 
        max_tokens: 150
      })
    });
    if (!response.ok) {
      console.error('API response error:', response.status, response.statusText);
      alert('Error generating blurb. Please try again later.');
      throw new Error(`API response error: ${response.status} ${response.statusText}`);
    }

    //parse and log the api response 
    const data = await response.json(); 

    return data.choices[0].message.content.trim(); 

  } catch (error) {
    console.error('API error:', error); 
    alert('Error generating blurb'); 
    throw error; //re-throw error to be caught by the calling function
  }
}

async function getCoverImage(blurb) {
  try {
    const response = await fetch(ENDPOINT_IMAGES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${API_KEY}`
      }, 
      body: JSON.stringify({
        model: "image-alpha-001",
        prompt: blurb,
        n: 1,
        size: "256x256",
        response_format: "url"
      })
    }); 

    if(!response.ok) {
      throw new Error('Failed to generate image')
    }

    const data = await response.json(); 
    return data.data[0].url; 

  } catch (error) {
    console.error(error); 
    alert('Error generating image'); 
    throw error; 
  }
}

async function handleFormSubmission(e) {
  e.preventDefault(); 

  const title = document.getElementById('mangaTitle').value.trim(); 
  const theme = document.getElementById('mangaTheme').value.trim(); 

  if(!title || !theme) {
    alert('Please enter both title and theme'); 
    return; 
  }

  //Manage UI state: show spinner, disable inputs and button
  document.getElementById('spinner').classList.remove('hidden');
  document.getElementById('generateButton').classList.add('hidden'); 
  document.getElementById('mangaTitle').disabled = true; 
  document.getElementById('mangaTheme').disabled = true; 
  document.getElementById('generatedBlurb').classList.add('hidden'); 
  document.getElementById('coverImage').classList.add('hidden'); 

  try {
    //clear previous results 
    document.getElementById('generatedBlurb').textContent = '';
    document.getElementById('coverImage').src = '';

    //generate blurb and image
    const blurb = await getBlurb(title, theme); 
    const imageURL = await getCoverImage(blurb); 

    //update the dom 
    document.getElementById('generatedBlurb').textContent = blurb; 
    document.getElementById('coverImage').src = imageURL; 
    document.getElementById('generatedBlurb').classList.remove('hidden');
    document.getElementById('coverImage').classList.remove('hidden'); 
  } catch (error) {
    //handle errors 
    console.error(error); 
    alert('Error gerenating manga - please try again');
  } finally {
    //reset UI state: hide spinner, enable inputs and button
    document.getElementById('spinner').classList.add('hidden'); 
    document.getElementById('generateButton').classList.remove('hidden');
    document.getElementById('mangaTitle').disabled = false; 
    document.getElementById('mangaTheme').disabled = false; 
  }
}

document.addEventListener("DOMContentLoaded", () => {
  API_KEY = localStorage.getItem("openai_api_key");

  if (!API_KEY) {
    alert(
      "Please store your API key in local storage with the key 'openai_api_key'.",
    );
    return;
  }

  const mangaInputForm = document.getElementById("mangaInputForm");
  mangaInputForm.addEventListener("submit", handleFormSubmission);
});

let retries = 0;
const maxRetries = 5;

async function makeRequest() {
  
  try {
    // Your API request logic here
  } catch (error) {
    if (error.status === 429 && retries < maxRetries) {
      // If a rate limit error occurs, wait and then retry
      const waitTime = Math.pow(2, retries) * 1000; // time in milliseconds
      retries++;
      setTimeout(makeRequest, waitTime);
    } else {
      // Handle other errors or max retries reached
      console.error(error);
    }
  }
}

