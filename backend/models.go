package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email        string             `bson:"email" json:"email"`
	PasswordHash string             `bson:"password_hash" json:"-"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
}

type BrandInfo struct {
	History     string `bson:"history" json:"history"`
	Philosophy  string `bson:"philosophy" json:"philosophy"`
	Mission     string `bson:"mission" json:"mission"`
	VoiceTone   string `bson:"voice_tone" json:"voice_tone"`
	Personality string `bson:"personality" json:"personality"`
	Interests   string `bson:"interests" json:"interests"`
}

type VisualIdentity struct {
	LogoURL      string `bson:"logo_url" json:"logo_url"`
	Slogan       string `bson:"slogan" json:"slogan"`
	Colors       string `bson:"colors" json:"colors"`
	Typography   string `bson:"typography" json:"typography"`
	Icons        string `bson:"icons" json:"icons"`
	DefaultTexts string `bson:"default_texts" json:"default_texts"`
	Photography  string `bson:"photography" json:"photography"`
	References   string `bson:"references" json:"references"`
}

type BusinessInfo struct {
	ProductOffered string   `bson:"product_offered" json:"product_offered"`
	Objective      string   `bson:"objective" json:"objective"`
	Advantage      string   `bson:"advantage" json:"advantage"`
	Benefits       []string `bson:"benefits" json:"benefits"`
	LandingTypes   []string `bson:"landing_types" json:"landing_types"`
}

type Audience struct {
	IdealClient string `bson:"ideal_client" json:"ideal_client"`
	SocialProof string `bson:"social_proof" json:"social_proof"`
}

type Action struct {
	UserGoal        string `bson:"user_goal" json:"user_goal"`
	MainButtonText  string `bson:"main_button_text" json:"main_button_text"`
	PostClickAction string `bson:"post_click_action" json:"post_click_action"`
}

type OtherInfo struct {
	DomainInfo    string `bson:"domain_info" json:"domain_info"`
	Integrations  string `bson:"integrations" json:"integrations"`
	FAQ           string `bson:"faq" json:"faq"`
	CreativeIdeas string `bson:"creative_ideas" json:"creative_ideas"`
}

type BriefingData struct {
	Brand    BrandInfo      `bson:"brand" json:"brand"`
	Visual   VisualIdentity `bson:"visual" json:"visual"`
	Business BusinessInfo   `bson:"business" json:"business"`
	Audience Audience       `bson:"audience" json:"audience"`
	Action   Action         `bson:"action" json:"action"`
	Other    OtherInfo      `bson:"other" json:"other"`
}

type Project struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID         *primitive.ObjectID `bson:"user_id,omitempty" json:"user_id"` // Owner (Optional)
	Name           string             `bson:"name" json:"name"`
	GDriveFolderID string             `bson:"gdrive_folder_id" json:"gdrive_folder_id"`
	Briefing       BriefingData       `bson:"briefing" json:"briefing"`
	CreatedAt      time.Time          `bson:"created_at" json:"created_at"`
}

type Folder struct {
	ID             primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	ProjectID      primitive.ObjectID  `bson:"project_id" json:"project_id"`
	ParentFolderID *primitive.ObjectID `bson:"parent_folder_id,omitempty" json:"parent_folder_id"`
	Name           string              `bson:"name" json:"name"`
	CreatedAt      time.Time           `bson:"created_at" json:"created_at"`
}

type Asset struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	ProjectID primitive.ObjectID  `bson:"project_id" json:"project_id"`
	FolderID  *primitive.ObjectID `bson:"folder_id,omitempty" json:"folder_id"`
	UserID    primitive.ObjectID  `bson:"user_id" json:"user_id"`
	Type      string              `bson:"type" json:"type"`
	Title     string              `bson:"title" json:"title"`
	FileName  string              `bson:"file_name,omitempty" json:"file_name"`
	Content   string              `bson:"content,omitempty" json:"content"`
	IsPublic  bool                `bson:"is_public" json:"is_public"`
	CreatedAt time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time           `bson:"updated_at" json:"updated_at"`
}
